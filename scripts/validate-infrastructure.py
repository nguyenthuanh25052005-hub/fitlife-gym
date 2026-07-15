#!/usr/bin/env python3
"""Static validation for infrastructure files when Docker is unavailable."""
from __future__ import annotations

import json
import pathlib
import re
import sys

import yaml

ROOT = pathlib.Path(__file__).resolve().parents[1]
errors: list[str] = []
passes: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        passes.append(name)
        print(f"PASS - {name}{f' ({detail})' if detail else ''}")
    else:
        errors.append(name)
        print(f"FAIL - {name}{f' ({detail})' if detail else ''}")


def load_yaml(relative: str):
    with (ROOT / relative).open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


compose = load_yaml("docker-compose.yml")
services = compose.get("services", {}) if isinstance(compose, dict) else {}
expected = {
    "postgres", "redis", "backend", "frontend", "analytics-service",
    "notification-service", "membership-service", "prometheus", "grafana",
    "sonarqube", "k6",
}
check("Docker Compose YAML parses", bool(services))
check("Docker Compose contains required services", expected.issubset(services),
      ", ".join(sorted(expected - set(services))) or "all present")

prometheus = load_yaml("infra/prometheus/prometheus.yml")
jobs = {item.get("job_name") for item in prometheus.get("scrape_configs", [])}
check("Prometheus configuration parses", bool(jobs))
check("Prometheus has core plus 3 service jobs",
      {"fitlife-core", "fitlife-analytics", "fitlife-notifications", "fitlife-memberships"}.issubset(jobs))

for relative in [
    "infra/grafana/dashboards/fitlife-overview.json",
    "docs/evidence/coverage-summary.json",
]:
    path = ROOT / relative
    if path.exists():
        try:
            json.loads(path.read_text(encoding="utf-8"))
            check(f"JSON parses: {relative}", True)
        except json.JSONDecodeError as exc:
            check(f"JSON parses: {relative}", False, str(exc))

for workflow in ROOT.glob(".github/workflows/*.yml"):
    try:
        workflow_text = workflow.read_text(encoding="utf-8")
        load_yaml(str(workflow.relative_to(ROOT)))
        check(f"Workflow YAML parses: {workflow.name}", True)
        check(f"Workflow has triggers: {workflow.name}", bool(re.search(r"(?m)^on:\s*$", workflow_text)))
    except yaml.YAMLError as exc:
        check(f"Workflow YAML parses: {workflow.name}", False, str(exc))

bad_sql = []
for controller in (ROOT / "backend/src/modules").rglob("*Controller.js"):
    text = controller.read_text(encoding="utf-8")
    if re.search(r"status\s*=\s*\"(?:active|inactive)\"", text):
        bad_sql.append(str(controller.relative_to(ROOT)))
check("PostgreSQL-compatible status SQL literals", not bad_sql, ", ".join(bad_sql))

check("Three FastAPI service entrypoints",
      len(list((ROOT / "services").glob("*/main.py"))) >= 3)

print(f"\nResult: {len(passes)}/{len(passes) + len(errors)} static infrastructure checks passed.")
sys.exit(1 if errors else 0)
