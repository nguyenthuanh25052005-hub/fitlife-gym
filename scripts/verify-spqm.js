#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });
const exists = (relative) => fs.existsSync(path.join(root, relative));
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const json = (relative) => JSON.parse(read(relative));

const backendPackage = json('backend/package.json');
const threshold = backendPackage.jest?.coverageThreshold?.global || {};
const compose = read('docker-compose.yml');
const workflow = read('.github/workflows/quality-gate.yml');
const sonar = read('sonar-project.properties');
const serviceDirs = fs.readdirSync(path.join(root, 'services'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && exists(`services/${entry.name}/main.py`))
  .map((entry) => entry.name);

check('L1 REST API Node.js + Express', exists('backend/src/app.js') && backendPackage.dependencies.express);
check('L1 SQLite baseline', exists('backend/src/database/sqliteDb.js') && (backendPackage.dependencies.sqlite3 || backendPackage.optionalDependencies?.sqlite3));
check('L1 Jest + Supertest', backendPackage.devDependencies.jest && backendPackage.devDependencies.supertest);
check('L1 ESLint', exists('backend/eslint.config.js') && backendPackage.scripts.lint);
check('L1 GitHub Actions CI', exists('.github/workflows/backend-ci.yml'));
check('L1 coverage gate >= 70% for all metrics',
  ['statements', 'branches', 'functions', 'lines'].every((metric) => Number(threshold[metric]) >= 70),
  `S=${threshold.statements}, B=${threshold.branches}, F=${threshold.functions}, L=${threshold.lines}`);
check('L1 SDLC / DoD / commit convention', exists('docs/spqm/SDLC-AND-ROLES.md') &&
  exists('docs/spqm/DEFINITION-OF-DONE.md') && exists('docs/spqm/CHANGE-MANAGEMENT.md'));

check('L2 JWT authentication and RBAC', backendPackage.dependencies.jsonwebtoken &&
  exists('backend/src/middleware/authMiddleware.js') && exists('backend/src/middleware/roleMiddleware.js'));
check('L2 PostgreSQL runtime', backendPackage.dependencies.pg &&
  exists('backend/src/database/postgresDb.js') && exists('backend/src/database/postgres/schema.sql'));
check('L2 FastAPI service', serviceDirs.length >= 1 && serviceDirs.some((name) => read(`services/${name}/main.py`).includes('FastAPI')));
check('L2 Docker Compose', compose.includes('postgres:') && compose.includes('backend:'));
check('L2 SonarQube configuration', exists('sonar-project.properties') && compose.includes('sonarqube:') && sonar.includes('sonar.qualitygate.wait=true'));
check('L2 coverage gate >= 80% for all metrics',
  ['statements', 'branches', 'functions', 'lines'].every((metric) => Number(threshold[metric]) >= 80),
  `S=${threshold.statements}, B=${threshold.branches}, F=${threshold.functions}, L=${threshold.lines}`);
check('L2 structured logs', read('backend/src/middleware/observabilityMiddleware.js').includes('requestId'));
check('L2 Pull Request review template', exists('.github/PULL_REQUEST_TEMPLATE/pull_request_template.md') && exists('.github/CODEOWNERS'));

check('L3 at least 3 microservices', serviceDirs.length >= 3, serviceDirs.join(', '));
check('L3 Redis cache', compose.includes('redis:') && serviceDirs.some((name) => read(`services/${name}/main.py`).includes('redis')));
check('L3 k6 load test', exists('tests/k6/payment-flow.js') && read('tests/k6/payment-flow.js').includes('p(95)<500'));
check('L3 Prometheus', exists('infra/prometheus/prometheus.yml') && compose.includes('prometheus:'));
check('L3 Grafana provisioned dashboard', exists('infra/grafana/dashboards/fitlife-overview.json') && compose.includes('grafana:'));
check('L3 automatic pipeline gate', workflow.includes('npm run quality') && workflow.includes('sonarqube-scan-action'));
check('L3 DORA + SLO + retrospective', exists('docs/spqm/DORA-SLO.md') &&
  exists('docs/spqm/CMMI-PDCA-RETROSPECTIVE.md'));

const coveragePath = exists('backend/coverage/coverage-summary.json')
  ? 'backend/coverage/coverage-summary.json'
  : exists('docs/evidence/coverage-summary.json') ? 'docs/evidence/coverage-summary.json' : null;
if (coveragePath) {
  const coverage = json(coveragePath).total;
  check('Measured coverage passes configured gate',
    coverage.statements.pct >= threshold.statements && coverage.lines.pct >= threshold.lines &&
    coverage.functions.pct >= threshold.functions && coverage.branches.pct >= threshold.branches,
    `S ${coverage.statements.pct}% | B ${coverage.branches.pct}% | F ${coverage.functions.pct}% | L ${coverage.lines.pct}%`);
} else {
  check('Measured coverage evidence exists', false, 'Run backend npm run test:ci');
}

console.log('\nFITLIFE SPQM COMPLIANCE CHECK\n');
for (const item of results) {
  console.log(`${item.ok ? 'PASS' : 'FAIL'} - ${item.name}${item.detail ? ` (${item.detail})` : ''}`);
}
const failed = results.filter((item) => !item.ok);
console.log(`\nResult: ${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) process.exit(1);
