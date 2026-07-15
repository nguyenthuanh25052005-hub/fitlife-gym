import json
import os
import time
from contextlib import contextmanager
from datetime import date, datetime, timezone

import psycopg
import redis
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fitlife:fitlife_secret@localhost:5432/fitlife")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app = FastAPI(title="FitLife Membership Service", version="1.0.0")
COUNTERS = {"requests": 0, "cache_hits": 0, "started_at": time.time()}


class MembershipStatusUpdate(BaseModel):
    status: str = Field(pattern="^(active|expired|frozen|cancelled)$")
    note: str | None = Field(default=None, max_length=500)


@contextmanager
def connection():
    with psycopg.connect(DATABASE_URL) as conn:
        yield conn


def cache():
    return redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=2)


@app.middleware("http")
async def request_counter(request, call_next):
    COUNTERS["requests"] += 1
    return await call_next(request)


@app.get("/health")
def health():
    postgres_ok = redis_ok = False
    try:
        with connection() as conn:
            postgres_ok = conn.execute("SELECT 1").fetchone()[0] == 1
    except Exception:
        pass
    try:
        redis_ok = bool(cache().ping())
    except Exception:
        pass
    return {
        "status": "OK" if postgres_ok and redis_ok else "DEGRADED",
        "service": "membership-service",
        "postgres": postgres_ok,
        "redis": redis_ok,
        "time": datetime.now(timezone.utc).isoformat(),
    }


def serialize_membership(row):
    return {
        "id": row[0], "member_id": row[1], "member_code": row[2], "member_name": row[3],
        "plan_id": row[4], "plan_name": row[5], "start_date": row[6], "end_date": row[7],
        "remaining_sessions": row[8], "status": row[9], "note": row[10],
    }


@app.get("/memberships")
def list_memberships(status: str | None = None, limit: int = Query(default=20, ge=1, le=100)):
    sql = """SELECT ms.id,ms.member_id,m.member_code,u.full_name,ms.plan_id,p.name,
                    ms.start_date,ms.end_date,ms.remaining_sessions,ms.status,ms.note
             FROM memberships ms JOIN members m ON m.id=ms.member_id
             JOIN users u ON u.id=m.user_id JOIN plans p ON p.id=ms.plan_id"""
    params = []
    if status:
        sql += " WHERE ms.status=%s"
        params.append(status)
    sql += " ORDER BY ms.id DESC LIMIT %s"
    params.append(limit)
    with connection() as conn:
        rows = conn.execute(sql, params).fetchall()
    return {"memberships": [serialize_membership(row) for row in rows]}


@app.get("/memberships/expiring/soon")
def expiring_memberships(days: int = Query(default=14, ge=1, le=90)):
    with connection() as conn:
        rows = conn.execute(
            """SELECT ms.id,ms.member_id,m.member_code,u.full_name,ms.plan_id,p.name,
                      ms.start_date,ms.end_date,ms.remaining_sessions,ms.status,ms.note
               FROM memberships ms JOIN members m ON m.id=ms.member_id
               JOIN users u ON u.id=m.user_id JOIN plans p ON p.id=ms.plan_id
               WHERE ms.status='active' AND ms.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + %s
               ORDER BY ms.end_date""",
            (days,),
        ).fetchall()
    return {"as_of": date.today(), "days": days, "memberships": [serialize_membership(row) for row in rows]}


@app.get("/memberships/{membership_id}")
def get_membership(membership_id: int):
    key = f"membership:{membership_id}"
    try:
        cached = cache().get(key)
        if cached:
            COUNTERS["cache_hits"] += 1
            return {"source": "redis", "membership": json.loads(cached)}
    except Exception:
        pass

    with connection() as conn:
        row = conn.execute(
            """SELECT ms.id,ms.member_id,m.member_code,u.full_name,ms.plan_id,p.name,
                      ms.start_date,ms.end_date,ms.remaining_sessions,ms.status,ms.note
               FROM memberships ms JOIN members m ON m.id=ms.member_id
               JOIN users u ON u.id=m.user_id JOIN plans p ON p.id=ms.plan_id
               WHERE ms.id=%s""",
            (membership_id,),
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Membership not found")
    membership = serialize_membership(row)
    try:
        cache().setex(key, 60, json.dumps(membership, default=str))
    except Exception:
        pass
    return {"source": "postgres", "membership": membership}


@app.patch("/memberships/{membership_id}/status")
def update_status(membership_id: int, payload: MembershipStatusUpdate):
    with connection() as conn:
        row = conn.execute(
            """UPDATE memberships SET status=%s, note=COALESCE(%s,note)
               WHERE id=%s RETURNING id""",
            (payload.status, payload.note, membership_id),
        ).fetchone()
        conn.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Membership not found")
    try:
        cache().delete(f"membership:{membership_id}")
    except Exception:
        pass
    return {"updated": True, "membership_id": membership_id, "status": payload.status}


@app.get("/metrics", response_class=PlainTextResponse)
def metrics():
    return "\n".join([
        "# TYPE fitlife_membership_requests_total counter",
        f"fitlife_membership_requests_total {COUNTERS['requests']}",
        "# TYPE fitlife_membership_cache_hits_total counter",
        f"fitlife_membership_cache_hits_total {COUNTERS['cache_hits']}",
        "# TYPE fitlife_membership_uptime_seconds gauge",
        f"fitlife_membership_uptime_seconds {time.time() - COUNTERS['started_at']:.2f}",
        "",
    ])
