# NexusFlow Product Guide

**Version 3.2 | January 2026**

## What is NexusFlow?

NexusFlow is a workflow automation platform designed for mid-size companies (50–2,000 employees). It connects your existing tools, automates repetitive processes, and provides actionable insights through a visual workflow builder.

Think of it as the connective tissue between your business applications — CRM, HR systems, finance tools, project management — automated without writing code.

## Core Features

### Visual Workflow Builder

The drag-and-drop workflow builder allows anyone to create automations without technical knowledge.

**Key capabilities:**
- **Trigger-based automation**: Start workflows from events in connected apps (new lead in Salesforce, ticket created in Zendesk, invoice approved in QuickBooks)
- **Conditional logic**: Branch workflows based on data values (if deal size > $50K, route to senior sales; otherwise, auto-assign)
- **Multi-step workflows**: Chain up to 50 actions in a single workflow
- **Error handling**: Configure retry logic, fallback actions, and error notifications
- **Scheduling**: Run workflows on schedules (hourly, daily, weekly) or on-demand
- **Version history**: Roll back to previous workflow versions with one click

### Pre-built Templates

NexusFlow ships with 200+ workflow templates organized by department:

- **Sales**: Lead scoring, pipeline alerts, contract generation, CRM hygiene
- **HR**: Onboarding sequences, PTO approvals, offboarding checklists
- **Finance**: Invoice processing, expense approvals, revenue reporting
- **IT**: User provisioning, access requests, incident escalation
- **Marketing**: Campaign orchestration, lead routing, content approval

### Integrations

NexusFlow connects to 150+ applications out of the box:

**CRM**: Salesforce, HubSpot, Pipedrive, Close
**Communication**: Slack, Microsoft Teams, Gmail, Outlook
**Project Management**: Jira, Asana, Linear, Monday.com
**Finance**: QuickBooks, Xero, Stripe, Bill.com
**HR**: BambooHR, Workday, Gusto, Rippling
**Storage**: Google Drive, Dropbox, SharePoint, Box
**Development**: GitHub, GitLab, Bitbucket, PagerDuty

Custom integrations can be built using our REST API or webhook triggers.

### AI-Powered Features

**Smart Routing**: Uses historical data to automatically route tasks, tickets, and approvals to the right person based on workload, expertise, and availability.

**Anomaly Detection**: Monitors workflow metrics and alerts when patterns deviate from normal — unusual approval delays, sudden spikes in error rates, or drops in completion rates.

**Natural Language Workflows**: Describe a workflow in plain English ("When a new employee is added to BambooHR, create their accounts in Slack, GitHub, and Google Workspace, then send them a welcome email") and NexusFlow generates the automation.

**Document Intelligence**: Extract structured data from invoices, contracts, and forms using AI. Supports PDF, images, and scanned documents with 97% accuracy on standard business documents.

## Pricing Tiers

### Starter — $29/user/month
- Up to 10 active workflows
- 5,000 workflow runs per month
- 50 integrations
- Email support
- Community templates
- 30-day run history

### Professional — $79/user/month
- Unlimited active workflows
- 50,000 workflow runs per month
- All 150+ integrations
- Priority email and chat support
- AI-powered features (Smart Routing, Anomaly Detection)
- Custom templates
- 1-year run history
- SSO (SAML 2.0)
- Audit logs

### Enterprise — Custom pricing
- Unlimited workflow runs
- All Professional features
- Natural Language Workflows
- Document Intelligence
- Dedicated customer success manager
- Custom SLAs (99.99% uptime guarantee)
- On-premises deployment option
- SOC 2 Type II compliance
- Custom integrations
- Unlimited run history
- Phone support

All plans include a 14-day free trial with full Professional features.

### Add-ons
- **Additional workflow runs**: $10 per 10,000 runs
- **Premium integrations**: $20/month per connector (SAP, Oracle, Workday)
- **Advanced analytics dashboard**: $15/user/month
- **Data residency (EU, UK, APAC)**: included in Enterprise, $500/month for Professional

## API Overview

NexusFlow provides a comprehensive REST API for programmatic access.

### Authentication

All API requests require a Bearer token. Generate API keys in Settings → API Keys. Tokens are scoped to your organization and can be limited to specific permissions.

```
Authorization: Bearer nx_live_abc123...
```

### Base URL

```
https://api.nexusflow.io/v2
```

### Rate Limits
- **Starter**: 100 requests/minute
- **Professional**: 1,000 requests/minute
- **Enterprise**: 10,000 requests/minute

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workflows` | List all workflows |
| POST | `/workflows` | Create a new workflow |
| PUT | `/workflows/{id}` | Update a workflow |
| DELETE | `/workflows/{id}` | Delete a workflow |
| POST | `/workflows/{id}/run` | Trigger a workflow manually |
| GET | `/workflows/{id}/runs` | List runs for a workflow |
| GET | `/runs/{id}` | Get run details and logs |
| GET | `/integrations` | List available integrations |
| POST | `/webhooks` | Create an incoming webhook |

### Webhooks

NexusFlow supports both incoming and outgoing webhooks:
- **Incoming**: Trigger workflows from external events via HTTP POST
- **Outgoing**: Send data to external endpoints when workflow actions complete

### SDKs

Official SDKs are available for:
- **Python**: `pip install nexusflow`
- **Node.js**: `npm install @nexusflow/sdk`
- **Ruby**: `gem install nexusflow`

## Security and Compliance

### Data Encryption
- All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- Customer data isolated per organization (multi-tenant architecture with logical separation)

### Compliance
- SOC 2 Type II certified (renewed annually)
- GDPR compliant (EU data processing agreement available)
- HIPAA BAA available on Enterprise plan
- ISO 27001 certification in progress (expected Q2 2026)

### Access Controls
- Role-based access control (RBAC) with 4 default roles: Owner, Admin, Editor, Viewer
- Custom roles available on Enterprise plan
- Audit logs retained for 2 years on Professional and Enterprise

### Data Residency
Data is stored in the region closest to your primary user base:
- **US**: AWS us-east-1 (Virginia)
- **EU**: AWS eu-west-1 (Ireland)
- **APAC**: AWS ap-southeast-1 (Singapore)
- **UK**: AWS eu-west-2 (London) — available on Enterprise plan

## Support

| Channel | Availability | Plans |
|---------|-------------|-------|
| Email | 24 hours response | All |
| Chat | Business hours (9–6 PT) | Professional, Enterprise |
| Phone | 24/7 | Enterprise |
| Dedicated CSM | Always available | Enterprise |

**Knowledge Base**: docs.nexusflow.io
**Status Page**: status.nexusflow.io
**Community Forum**: community.nexusflow.io
