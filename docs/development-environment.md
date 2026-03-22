# Development Environment

## Node Version

This repository is pinned to:

```text
24.9.0
```

Use:

```bash
nvm use
```

from the repository root or from `backend/`.

## Why This Matters

The backend uses `better-sqlite3`, which is a native Node module. If dependencies are installed or rebuilt with one Node version and the backend is started with another, the server can fail with an error like:

```text
NODE_MODULE_VERSION 131 ... requires 137
```

## Database Provider

Local development is expected to use SQLite:

```env
DATABASE_PROVIDER=sqlite
DATABASE_URL="file:./dev.db"
```

The backend now supports switching providers by environment:

- `sqlite` for local development
- `postgresql` for cloud deployment
- `mysql` for cloud deployment

Runtime behavior:

- `sqlite` uses the `better-sqlite3` adapter
- `postgresql` and `mysql` use the standard Prisma datasource URL

## Safe Recovery Steps

Run these commands with the pinned Node version active:

```bash
cd /Users/cmrabet/Learning/fupiz
nvm use
cd backend
rm -rf node_modules
npm install
npm run start:dev
```

## zsh / PATH Fix

If `nvm use` says Node `24.9.0` is active but `which node` still points to `/opt/homebrew/bin/node`, your shell `PATH` order is wrong.

Your `nvm` initialization should run after any manual `PATH` exports that prepend Homebrew paths, or it should explicitly put the `nvm` bin first.

Useful checks:

```bash
which node
which npm
node -v
node -p "process.versions.modules"
```

Expected values for this project:

- `node -v` -> `v24.9.0`
- `process.versions.modules` -> `137`
