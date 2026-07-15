import json
import os
import time
from contextlib import contextmanager
from datetime import datetime, timezone

import psycopg
import redis
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fitlife:fitlife_secret@localhost:5432/fitlife")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app = FastAPI(title="FitLife Notification Service", version="1.1.0")
COUNTERS = {"sent": 0, "errors": 0, "started_at": time.time()}


class Notification(BaseModel):
    recipient: str = Field(min_length=3, max_length=120)
    title: str = Field(min_length=2, max_length=150)
    message: str = Field(min_length=2, max_length=2000)
    channel: str = Field(default="in_app", pattern="^(in_app|email|sms)$")


@contextmanager
def connection():
    with psycopg.connect(DATABASE_URL) as conn:
        yield conn


def cache():
    return redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=2)


@app.on_event("startup")
def startup() -> None:
    with connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS service_notifications (
              id BIGSERIAL PRIMARY KEY,
              recipient TEXT NOT NULL,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              channel TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'queued',
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


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
        "service": "notification-service",
        "postgres": postgres_ok,
        "redis": redis_ok,
        "time": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/notifications", status_code=202)
def create_notification(payload: Notification):
    try:
        with connection() as conn:
            row = conn.execute(
                """INSERT INTO service_notifications(recipient,title,message,channel,status)
                   VALUES (%s,%s,%s,%s,'queued') RETURNING id,created_at""",
                (payload.recipient, payload.title, payload.message, payload.channel),
            ).fetchone()
            conn.commit()
        event = {"id": row[0], "created_at": row[1].isoformat(), **payload.model_dump()}
        try:
            redis_client = cache()
            redis_client.lpush(f"notifications:{payload.recipient}", json.dumps(event))
            redis_client.ltrim(f"notifications:{payload.recipient}", 0, 49)
            redis_client.publish("fitlife.notifications", json.dumps(event))
        except Exception:
            pass
        COUNTERS["sent"] += 1
        return {"accepted": True, "notification": event}
    except Exception as exc:
        COUNTERS["errors"] += 1
        raise HTTPException(status_code=503, detail=f"Notification storage unavailable: {exc}") from exc


@app.get("/notifications/{recipient}")
def list_notifications(recipient: str, limit: int = Query(default=20, ge=1, le=100)):
    try:
        cached = cache().lrange(f"notifications:{recipient}", 0, limit - 1)
        if cached:
            return {"source": "redis", "notifications": [json.loads(item) for item in cached]}
    except Exception:
        pass
    with connection() as conn:
        rows = conn.execute(
            """SELECT id,recipient,title,message,channel,status,created_at
               FROM service_notifications WHERE recipient=%s ORDER BY id DESC LIMIT %s""",
            (recipient, limit),
        ).fetchall()
    return {
        "source": "postgres",
        "notifications": [
            {"id": row[0], "recipient": row[1], "title": row[2], "message": row[3],
             "channel": row[4], "status": row[5], "created_at": row[6]}
            for row in rows
        ],
    }


@app.get("/metrics", response_class=PlainTextResponse)
def metrics():
    return "\n".join([
        "# TYPE fitlife_notifications_sent_total counter",
        f"fitlife_notifications_sent_total {COUNTERS['sent']}",
        "# TYPE fitlife_notification_errors_total counter",
        f"fitlife_notification_errors_total {COUNTERS['errors']}",
        "# TYPE fitlife_notification_uptime_seconds gauge",
        f"fitlife_notification_uptime_seconds {time.time() - COUNTERS['started_at']:.2f}",
        "",
    ])
