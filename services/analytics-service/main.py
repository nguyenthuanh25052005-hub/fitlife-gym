import os
import time
from contextlib import contextmanager
from datetime import datetime, timezone

import psycopg
import redis
from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://fitlife:fitlife_secret@localhost:5432/fitlife")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = FastAPI(title="FitLife Analytics Service", version="1.1.0")
COUNTERS = {"requests": 0, "errors": 0, "started_at": time.time()}


class MetricInput(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    value: float
    unit: str = Field(default="count", max_length=30)
    source: str = Field(default="fitlife", max_length=50)


@contextmanager
def connection():
    with psycopg.connect(DATABASE_URL) as conn:
        yield conn


def redis_client():
    return redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=2)


@app.on_event("startup")
def startup() -> None:
    with connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS quality_metrics (
              id BIGSERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              value DOUBLE PRECISION NOT NULL,
              unit TEXT NOT NULL,
              source TEXT NOT NULL,
              recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


@app.middleware("http")
async def count_requests(request, call_next):
    COUNTERS["requests"] += 1
    try:
        response = await call_next(request)
        if response.status_code >= 500:
            COUNTERS["errors"] += 1
        return response
    except Exception:
        COUNTERS["errors"] += 1
        raise


@app.get("/health")
def health():
    postgres_ok = False
    redis_ok = False
    try:
        with connection() as conn:
            postgres_ok = conn.execute("SELECT 1").fetchone()[0] == 1
    except Exception:
        postgres_ok = False
    try:
        redis_ok = bool(redis_client().ping())
    except Exception:
        redis_ok = False
    status = "OK" if postgres_ok and redis_ok else "DEGRADED"
    return {
        "status": status,
        "service": "analytics-service",
        "postgres": postgres_ok,
        "redis": redis_ok,
        "time": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/analytics/metrics", status_code=201)
def record_metric(metric: MetricInput):
    try:
        with connection() as conn:
            row = conn.execute(
                """INSERT INTO quality_metrics(name, value, unit, source)
                   VALUES (%s, %s, %s, %s)
                   RETURNING id, recorded_at""",
                (metric.name, metric.value, metric.unit, metric.source),
            ).fetchone()
            conn.commit()
        try:
            redis_client().delete("analytics:summary")
        except Exception:
            pass
        return {
            "id": row[0],
            "recorded_at": row[1],
            "metric": metric.model_dump(),
        }
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Analytics storage unavailable: {exc}") from exc


@app.get("/analytics/summary")
def summary():
    cache = redis_client()
    try:
        cached = cache.get("analytics:summary")
        if cached:
            import json
            return json.loads(cached)
    except Exception:
        cache = None

    with connection() as conn:
        rows = conn.execute(
            """SELECT name, COUNT(*) AS samples, ROUND(AVG(value)::numeric, 2) AS average,
                      MIN(value) AS minimum, MAX(value) AS maximum
               FROM quality_metrics GROUP BY name ORDER BY name"""
        ).fetchall()
    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "metrics": [
            {"name": row[0], "samples": row[1], "average": float(row[2]),
             "minimum": float(row[3]), "maximum": float(row[4])}
            for row in rows
        ],
    }
    if cache:
        try:
            import json
            cache.setex("analytics:summary", 30, json.dumps(result))
        except Exception:
            pass
    return result


@app.get("/metrics", response_class=PlainTextResponse)
def metrics():
    uptime = max(time.time() - COUNTERS["started_at"], 0)
    return "\n".join([
        "# TYPE fitlife_analytics_requests_total counter",
        f"fitlife_analytics_requests_total {COUNTERS['requests']}",
        "# TYPE fitlife_analytics_errors_total counter",
        f"fitlife_analytics_errors_total {COUNTERS['errors']}",
        "# TYPE fitlife_analytics_uptime_seconds gauge",
        f"fitlife_analytics_uptime_seconds {uptime:.2f}",
        "",
    ])
