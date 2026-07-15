#!/usr/bin/env sh
set -eu
SONAR_URL="${SONAR_URL:-http://localhost:9000}"
SONAR_TOKEN="${SONAR_TOKEN:?Set SONAR_TOKEN before running this script}"
GATE_NAME="FitLife SPQM Gate"
PROJECT_KEY="${SONAR_PROJECT_KEY:-fitlife-gym}"

api() {
  curl -fsS -u "${SONAR_TOKEN}:" "$@"
}

echo "Creating or locating quality gate..."
GATE_ID=$(api -X POST "${SONAR_URL}/api/qualitygates/create" --data-urlencode "name=${GATE_NAME}" 2>/dev/null \
  | sed -n 's/.*"id":"\{0,1\}\([0-9]*\)"\{0,1\}.*/\1/p' || true)
if [ -z "$GATE_ID" ]; then
  GATE_ID=$(api "${SONAR_URL}/api/qualitygates/list" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(next(str(g['id']) for g in d['qualitygates'] if g['name']=='${GATE_NAME}'))")
fi

create_condition() {
  metric="$1"; op="$2"; value="$3"
  api -X POST "${SONAR_URL}/api/qualitygates/create_condition" \
    -d "gateId=${GATE_ID}" -d "metric=${metric}" -d "op=${op}" -d "error=${value}" >/dev/null 2>&1 || true
}

create_condition new_coverage LT 80
create_condition new_bugs GT 0
create_condition new_vulnerabilities GT 0
create_condition new_security_hotspots_reviewed LT 100
create_condition new_duplicated_lines_density GT 5

api -X POST "${SONAR_URL}/api/qualitygates/select" \
  --data-urlencode "projectKey=${PROJECT_KEY}" \
  --data-urlencode "gateName=${GATE_NAME}" >/dev/null

echo "Quality gate '${GATE_NAME}' assigned to '${PROJECT_KEY}'."
