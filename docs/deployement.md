# Deployement

## Goal

Explain how to deploy this application to the cloud and what to watch for with the current stack.

## Current Architecture

- Frontend: Angular static app
- Backend: NestJS API
- ORM: Prisma
- Current local database setup: SQLite via `better-sqlite3`
- Current dev flow: repo root runs frontend and backend separately

## Important Deployment Note

The backend now supports provider switching by environment:

- `sqlite` for local development
- `postgresql` for deployment
- `mysql` for deployment

For most cloud deployments, you should still plan to use a managed PostgreSQL database instead of SQLite.

That means the production deployment path should include:

1. set `DATABASE_PROVIDER=postgresql` or `DATABASE_PROVIDER=mysql`
2. set a production `DATABASE_URL`
3. run Prisma migration/deploy commands against that cloud database

SQLite remains the right default for local development:

```env
DATABASE_PROVIDER=sqlite
DATABASE_URL="file:./dev.db"
```

## Recommended Deployment Shape

For this app, the cleanest production shape is:

- host the Angular frontend as a static site
- host the Nest backend as a web service
- use a managed PostgreSQL database
- store secrets in provider-managed environment variables

## Top 5 Hosting Providers

These are the five most practical options for this stack today. Cost and popularity tags below are practical guidance, not official provider labels.

### 1. Render

- Fit: very good for hosting both static frontend and Node backend
- Cost tag: `$`
- Popularity tag: `High`
- Why it fits:
  - simple static-site hosting
  - simple Node web-service hosting
  - managed Postgres option
  - straightforward environment variable management
- Best for:
  - simple full-stack deployment with low ops overhead

### 2. Railway

- Fit: very good for small-to-medium full-stack apps
- Cost tag: `$$`
- Popularity tag: `High`
- Why it fits:
  - easy service setup
  - easy environment variable handling
  - easy PostgreSQL provisioning
  - fast developer workflow
- Best for:
  - fast shipping and iterative product work

### 3. DigitalOcean App Platform

- Fit: strong managed platform choice for frontend + backend
- Cost tag: `$$`
- Popularity tag: `High`
- Why it fits:
  - managed app hosting
  - managed databases
  - predictable team-friendly platform
- Best for:
  - teams that want a more “infrastructure but still managed” option

### 4. Fly.io

- Fit: good if you want more runtime control
- Cost tag: `$$`
- Popularity tag: `Medium`
- Why it fits:
  - good Node backend hosting
  - flexible deployment model
  - strong control over regions and runtime behavior
- Best for:
  - teams that want more control than Render/Railway without going full AWS

### 5. AWS

- Fit: strongest long-term flexibility, highest operational complexity
- Cost tag: `$$$`
- Popularity tag: `Very High`
- Why it fits:
  - broadest cloud ecosystem
  - multiple hosting paths for frontend and backend
  - multiple managed database options
  - strongest scaling ceiling
- Best for:
  - production systems that may grow into more advanced infrastructure needs

## Provider Summary

If you want the shortest path:

- `Render` or `Railway`

If you want managed but a bit more infrastructure shape:

- `DigitalOcean App Platform`

If you want more runtime control:

- `Fly.io`

If you want maximum flexibility and do not mind more setup:

- `AWS`

## Frontend Deployment

The Angular frontend is the easy half.

Typical production flow:

1. build the frontend
2. deploy the generated static assets
3. point frontend API calls at the deployed backend URL

You will need a production backend base URL strategy for the frontend.

Right now the app uses hardcoded localhost URLs in several services, so a proper production deployment should move those into environment-based frontend configuration.

## Backend Deployment

The Nest backend should be deployed as a long-running web service.

Typical production flow:

1. install dependencies
2. build the backend
3. run Prisma migration/deploy against the production database
4. start the compiled Nest app

The backend also needs working SMTP and Stripe environment variables if you want:

- account activation email
- contact/support email delivery
- billing

## Cloud Database

### What You Should Use

Use a managed PostgreSQL database for production.

Good practical options:

- Render Postgres
- Railway Postgres
- DigitalOcean Managed PostgreSQL
- Fly Postgres-compatible setup
- AWS RDS for PostgreSQL
- Neon or Supabase as external managed Postgres providers

### Why Not Keep SQLite

SQLite is useful locally, but it is a poor default for cloud deployment because:

- many cloud filesystems are ephemeral
- horizontal scaling gets awkward
- backups, failover, and operational visibility are weaker
- local-disk coupling makes service mobility harder

### Production Database Checklist

- create a managed PostgreSQL instance
- set `DATABASE_PROVIDER=postgresql`
- set `DATABASE_URL`
- run Prisma migrations against production
- verify connection from the deployed backend

## Environment Variable Handling

### General Rule

Do not hardcode production secrets in the repository.

Use provider-managed environment variable storage for:

- `JWT_SECRET`
- `DATABASE_URL`
- SMTP credentials
- `MAIL_FROM`
- `SUPPORT_EMAIL`
- Stripe secrets
- `FRONTEND_URL`
- `ADMIN_EMAILS`

### Frontend vs Backend

- Backend secrets must stay server-side only.
- Frontend should only receive values that are safe for the browser.

### Recommended Approach

- keep local dev values in `.env`
- set production values directly in the cloud provider dashboard or secret manager
- use different values for local, staging, and production
- rotate secrets if they were ever shared insecurely

## Minimum Production Env Set

At minimum, production will need:

```env
JWT_SECRET=...
DATABASE_PROVIDER=postgresql
DATABASE_URL=...
FRONTEND_URL=https://your-frontend-domain
MAIL_FROM=...
SUPPORT_EMAIL=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_SECURE=...
SMTP_USER=...
SMTP_PASS=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_PRO_MONTHLY=...
STRIPE_PRICE_BUSINESS_MONTHLY=...
ADMIN_EMAILS=admin@example.com
```

## Suggested First Deployment Path

The most practical first cloud deployment for this project is:

1. move database setup to managed PostgreSQL
2. set `DATABASE_PROVIDER=postgresql`
3. deploy backend to Render or Railway
4. deploy frontend to Render static hosting or another static host
5. configure environment variables in the provider dashboard
6. test:
   - login
   - registration
   - activation email
   - contact form
   - dashboard support form
   - billing webhook flow
   - admin area

## Migration Caveat

Prisma schema migrations are provider-specific enough that moving an existing SQLite project to PostgreSQL or MySQL should be treated as a real database migration step, not just an env flip.

In practice:

- new environments can start clean on PostgreSQL or MySQL
- existing SQLite data should be exported and migrated deliberately
- do not assume old SQLite migrations will be production-safe without review

## Official References

- Render pricing: https://render.com/pricing
- Render environment variables: https://render.com/docs/environment-variables
- Render Postgres: https://render.com/docs/postgresql
- Railway pricing: https://railway.com/pricing
- Railway variables: https://docs.railway.com/guides/variables
- Railway databases: https://docs.railway.com/guides/postgresql
- Fly.io pricing: https://fly.io/docs/about/pricing/
- Fly.io secrets: https://fly.io/docs/apps/secrets/
- Fly Postgres guide: https://fly.io/docs/postgres/
- DigitalOcean App Platform pricing: https://www.digitalocean.com/pricing/app-platform
- DigitalOcean App Platform env vars: https://docs.digitalocean.com/products/app-platform/how-to/use-environment-variables/
- DigitalOcean managed databases: https://docs.digitalocean.com/products/databases/
- AWS App Runner pricing: https://aws.amazon.com/apprunner/pricing/
- AWS App Runner env vars: https://docs.aws.amazon.com/apprunner/latest/dg/env-variable-manage.html
- AWS RDS for PostgreSQL: https://aws.amazon.com/rds/postgresql/
