# Build & Environment Setup

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (easiest path — starts everything)
- OR: Node 20+, npm, and a local PostgreSQL 16 instance

---

## Quickstart with Docker (recommended)

```bash
docker compose --profile full up -d --build
```

- Frontend: http://localhost:3000
- API: http://localhost:4000
- Postgres: localhost:**5434** (port 5434 to avoid conflicts with local installs on 5432/5433)

To stop: `docker compose --profile full down`

---

## Manual setup (without Docker)

### 1. Database

Start a local Postgres 16 instance, then:

```bash
psql -U postgres -c "CREATE DATABASE five_college_connect;"
psql -U postgres -d five_college_connect -f five_college_connect/server/database/schema.sql
psql -U postgres -d five_college_connect -f five_college_connect/server/database/seed.sql
```

Required Postgres extensions (applied automatically by the schema):

| Extension  | Purpose                          |
|------------|----------------------------------|
| `pgcrypto` | UUID generation via `gen_random_uuid()` |
| `pg_trgm`  | Trigram indexing for fuzzy title search |

### 2. Server environment

Copy the example file and fill in values:

```bash
cp five_college_connect/server/.env.example five_college_connect/server/.env
```

| Variable | Required | Default / Notes |
|---|---|---|
| `PORT` | No | `4000` |
| `NODE_ENV` | No | `development` |
| `DATABASE_URL` | **Yes** | `postgres://postgres:postgres@localhost:5434/five_college_connect` |
| `DB_SSL` | No | `false` for local, `true` for hosted Postgres |
| `AUTH_TOKEN_SECRET` | **Yes** | Any long random string — change from default |
| `AUTH_TOKEN_EXPIRES_IN_HOURS` | No | `24` |
| `CLIENT_URL` | No | `http://localhost:3000` |
| `EMAIL_VERIFICATION_BASE_URL` | No | `http://localhost:3000/verify-email` |
| `ALLOWED_EMAIL_DOMAINS` | No | `umass.edu,amherst.edu,smith.edu,hampshire.edu,mtholyoke.edu` |
| `MAILJET_API_KEY` | No | Leave blank in dev — server logs verification links to console instead |
| `MAILJET_API_SECRET` | No | See above |
| `EMAIL_FROM` | No | `Five College Connect <fivecollegeconnect@gmail.com>` |
| `EMAIL_REPLY_TO` | No | `fivecollegeconnect@gmail.com` |

Then start the server:

```bash
cd five_college_connect/server
npm install
npm start
```

### 3. Client environment

```bash
cp five_college_connect/client/.env.example five_college_connect/client/.env
```

| Variable | Required | Default |
|---|---|---|
| `VITE_API_URL` | **Yes** | `http://localhost:4000` |

Then start the client:

```bash
cd five_college_connect/client
npm install
npm run dev
```

---

## Running tests

```bash
# Frontend (vitest)
cd five_college_connect/client && npm test

# Backend (Jest)
cd five_college_connect/server && npm test
```

---

## Database connection string format

```
postgres://<user>:<password>@<host>:<port>/<database>
```

Default local value:
```
postgres://postgres:postgres@localhost:5434/five_college_connect
```

For a hosted instance (e.g. Supabase, Railway, Render):
```
postgres://<user>:<password>@<host>:5432/<database>?sslmode=require
```
Set `DB_SSL=true` alongside it.
