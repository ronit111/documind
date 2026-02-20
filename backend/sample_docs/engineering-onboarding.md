# Nexus Labs Engineering Onboarding Guide

**For new engineers joining the NexusFlow team**

## Your First Week

### Day 1: Access and Setup
1. IT will have your MacBook Pro (M3, 16GB RAM minimum) ready at your desk or shipped to your home
2. Complete the following account setups (invitations sent to your email):
   - **GitHub**: Accept the org invite for `nexuslabs-eng`. Enable 2FA immediately.
   - **Slack**: Join `#engineering`, `#team-{your-team}`, `#deploys`, `#incidents`
   - **Linear**: Your team's project board is pre-configured
   - **Notion**: Engineering wiki is at notion.so/nexuslabs/engineering
   - **AWS**: Request access through IT. You'll get a role-scoped IAM identity.
   - **Datadog**: Monitoring dashboards. Read-only by default, request editor for your services.
3. Clone the monorepo: `git clone git@github.com:nexuslabs-eng/nexusflow.git`
4. Follow the README setup instructions to get the dev environment running

### Day 2–3: Codebase Orientation
- Read the Architecture Decision Records (ADRs) in `/docs/adr/`
- Review the service map in Notion (Engineering → Architecture → Service Map)
- Your onboarding buddy will walk you through your team's services
- Complete the "NexusFlow Architecture 101" Notion course (takes ~2 hours)

### Day 4–5: First Contribution
- Your manager will assign a "starter issue" labeled `good-first-issue` in Linear
- These are scoped to be completable in 1–2 days
- Your onboarding buddy will review your first PR

## Development Environment

### Prerequisites
- macOS 13+ (Ventura or later)
- Homebrew
- Docker Desktop (4.25+)
- Node.js 20 LTS (via nvm)
- Python 3.12+ (via pyenv)
- Go 1.22+ (for the API gateway)

### Setup Script
```bash
cd nexusflow
make setup  # Installs all dependencies, sets up local databases, seeds test data
```

This script will:
1. Install Node.js, Python, and Go dependencies
2. Start PostgreSQL, Redis, and Elasticsearch in Docker
3. Run database migrations
4. Seed the development database with test data
5. Build the frontend and start all services

### Local Services
After `make setup`, the following services are running:

| Service | URL | Language |
|---------|-----|----------|
| Web App | http://localhost:3000 | TypeScript (Next.js) |
| API Gateway | http://localhost:8080 | Go |
| Workflow Engine | http://localhost:8081 | Python (FastAPI) |
| Integration Service | http://localhost:8082 | Python (FastAPI) |
| AI Service | http://localhost:8083 | Python (FastAPI) |
| PostgreSQL | localhost:5432 | — |
| Redis | localhost:6379 | — |
| Elasticsearch | localhost:9200 | — |

### Environment Variables
Copy `.env.example` to `.env.local` and fill in your local values. Never commit `.env.local`. API keys for third-party services in development are stored in 1Password (vault: "Engineering - Dev Keys").

## Repository Structure

```
nexusflow/
├── apps/
│   ├── web/              # Next.js frontend
│   ├── gateway/          # Go API gateway
│   └── docs/             # Documentation site (Docusaurus)
├── services/
│   ├── workflow-engine/  # Core automation engine (Python)
│   ├── integrations/     # Integration connectors (Python)
│   ├── ai/               # AI/ML services (Python)
│   └── notifications/    # Email, Slack, push notifications (Python)
├── packages/
│   ├── shared-types/     # TypeScript type definitions
│   ├── ui/               # Shared React component library
│   └── utils/            # Shared utility functions
├── infrastructure/
│   ├── terraform/        # AWS infrastructure as code
│   ├── k8s/              # Kubernetes manifests
│   └── docker/           # Docker configurations
├── docs/
│   ├── adr/              # Architecture Decision Records
│   ├── api/              # API specifications (OpenAPI)
│   └── runbooks/         # Operational runbooks
└── scripts/              # Build, deploy, and utility scripts
```

## Code Review Process

### Pull Request Guidelines

1. **Branch naming**: `{type}/{linear-id}-{short-description}`
   - Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
   - Example: `feat/ENG-1234-add-webhook-retry`

2. **PR requirements**:
   - Link the Linear issue in the PR description
   - Include a summary of what changed and why
   - Add screenshots for UI changes
   - All CI checks must pass (tests, linting, type checking)
   - At least 1 approval required (2 for changes to core infrastructure)

3. **PR size**: Aim for under 400 lines of changed code. If a feature is larger, break it into stacked PRs.

4. **Review turnaround**: Reviewers should respond within 4 business hours. If you're blocked, ping in `#engineering` on Slack.

### Code Style

- **TypeScript/JavaScript**: ESLint + Prettier (config in `.eslintrc.js` and `.prettierrc`)
- **Python**: Ruff for linting and formatting (config in `pyproject.toml`)
- **Go**: `gofmt` + `golangci-lint` (config in `.golangci.yml`)

All formatting is enforced by pre-commit hooks and CI.

### Testing Requirements

- All new features must include tests
- Bug fixes should include a regression test
- Coverage thresholds:
  - Backend services: 80% line coverage minimum
  - Frontend: 70% line coverage minimum
  - Critical paths (payments, auth, data mutations): 95%+ coverage

Test structure:
- **Unit tests**: In `__tests__/` or `_test.go` files alongside source code
- **Integration tests**: In `tests/integration/` directory per service
- **E2E tests**: In `apps/web/e2e/` using Playwright

Run tests: `make test` (all), `make test-unit` (unit only), `make test-e2e` (E2E only)

## Deployment Process

### Environments

| Environment | Purpose | Deploy Method |
|-------------|---------|--------------|
| `dev` | Active development | Auto-deploy on merge to `main` |
| `staging` | Pre-production testing | Manual promote from `dev` |
| `production` | Customer-facing | Manual promote from `staging` with approval |

### CI/CD Pipeline

We use GitHub Actions for CI/CD:

1. **On PR**: Lint, type check, unit tests, build verification
2. **On merge to main**: Full test suite, build Docker images, deploy to `dev`
3. **Staging deploy**: `make deploy-staging` (requires `dev` tests passing)
4. **Production deploy**: `make deploy-prod` (requires staging sign-off in `#deploys` Slack channel)

### Rollback

If a production deployment causes issues:
1. Run `make rollback-prod` to revert to the previous version
2. Post in `#incidents` with details
3. The on-call engineer will assess and coordinate

### Feature Flags

We use LaunchDarkly for feature flags. All new features should be behind a flag for gradual rollout:

```python
if feature_flags.is_enabled("new-ai-routing", user_context):
    return new_routing_logic(task)
else:
    return legacy_routing(task)
```

Flag naming convention: `{team}-{feature-short-name}` (e.g., `platform-webhook-retry-v2`)

## On-Call and Incidents

### On-Call Rotation

Each team maintains a weekly on-call rotation managed in PagerDuty. On-call responsibilities:
- Monitor alerts during business hours and respond within 15 minutes
- After-hours: respond to P1 alerts within 30 minutes
- Triage and route alerts that don't belong to your team
- Write post-incident reviews for any P1/P2 incidents

### Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|---------|
| P1 | Service down, data loss risk | 15 minutes | Production outage, data breach |
| P2 | Major feature broken | 1 hour | Workflow execution failures, integration outage |
| P3 | Minor feature issue | 4 hours | UI bug, slow performance |
| P4 | Cosmetic or low-impact | Next business day | Typo, minor styling issue |

### Incident Process
1. Alert fires → on-call engineer acknowledges in PagerDuty
2. Create incident channel: `#inc-{date}-{short-description}`
3. Assess severity and communicate in `#incidents`
4. Fix, verify, and close
5. Write post-incident review within 48 hours (template in Notion)

## Useful Resources

- **Engineering Wiki**: notion.so/nexuslabs/engineering
- **API Documentation**: api-docs.nexusflow.io
- **Design System**: storybook.nexusflow.io
- **Architecture Diagrams**: Notion → Engineering → Architecture
- **Runbooks**: `/docs/runbooks/` in the monorepo
- **Team Directory**: BambooHR or Slack profile cards
