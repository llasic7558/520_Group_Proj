# Quick Build & Environment Setup

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



# BUILD.md — Five College Connect more in depth build

Installation, build, and deployment instructions for the Five College Connect project.

## 1. Project Layout

```
Project/
├── docker-compose.yml           # Postgres + server + client
├── package.json                 # Root dev scripts
├── playwright.config.js         # End-to-end test config
├── five_college_connect/
│   ├── client/                  # React + Vite frontend (JavaScript)
│   └── server/                  # Express + Node.js backend (PostgreSQL)
└── scripts/                     # Utility scripts (coverage report, etc.)
```

The frontend lives in `five_college_connect/client` and the backend lives in
`five_college_connect/server`. Both run independently and communicate over HTTP.

## 2. Prerequisites

| Tool | Required for | Minimum version |
|------|--------------|-----------------|
| Docker Desktop (or Docker Engine + Compose v2) | Postgres container, full-stack run | latest |
| Node.js | Local server/client dev | 20.0.0 |
| npm | Package management | 10.x (ships with Node 20) |
| psql (optional) | Manual DB inspection | any |
| k6 (optional) | Load testing | latest |

You do **not** need to install PostgreSQL on your host machine. The Docker
container handles the database in both the user path and the developer path.

## 3. Quickstart — One-Command Full Stack

For evaluators, demos, or anyone who just wants to see the app run.

```bash
git clone <repo-url>
cd Project
docker compose --profile full up
```

Open <http://localhost:3000>.

The first run pulls the Postgres image, builds the server and client images,
applies `database/schema.sql`, and seeds demo data from `database/seed.sql`.
Subsequent runs reuse the volume and start in seconds.

**Demo login**

- Email: `emily.rodriguez@umass.edu`
- Password: `DemoPass123!`

Or sign up with any allowed Five Colleges domain
(`@umass.edu`, `@amherst.edu`, `@smith.edu`, `@hampshire.edu`,
`@mtholyoke.edu`).

**Stop the stack**

```bash
docker compose --profile full down
```

**Wipe the database and re-seed**

```bash
docker compose down -v && docker compose --profile full up
```

## 4. Developer Setup — Hot Reload

Use this path while editing code. Postgres runs in Docker; Express and Vite
run on the host so changes hot-reload instantly.

```bash
git clone <repo-url>
cd Project

# 1. Copy env templates
cp five_college_connect/server/.env.example five_college_connect/server/.env
cp five_college_connect/client/.env.example five_college_connect/client/.env

# 2. Install dependencies for root, server, and client
npm run install:all

# 3. Start the dev loop
npm run dev
```

`npm run dev` starts:

1. Postgres in Docker (waits for the healthcheck)
2. Express on port 4000 with `node --watch`
3. Vite dev server on port 3000 with hot module reload

Logs appear in one terminal with `server` (blue) and `client` (green) prefixes.
Ctrl+C stops both processes cleanly.

### 4.1 Useful root scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Postgres in Docker, server + client on host |
| `npm run up` | Full Docker stack (user path) |
| `npm run down` | Stop the Docker Postgres container |
| `npm run db:up` | Start only Postgres |
| `npm run db:down` | Stop Postgres without removing the volume |
| `npm run db:reset` | Drop the volume and re-init schema + seed |
| `npm run install:all` | Install root, server, and client deps |
| `npm run test:server` | Backend Node test runner |
| `npm run test:client` | Frontend Vitest |
| `npm run test:e2e` | Playwright end-to-end suite |
| `npm run test:e2e:install` | One-time Playwright browser install |
| `npm run coverage` | Combined backend + frontend coverage report |

### 4.2 Server-only scripts

From `five_college_connect/server/`:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Server with `--watch` |
| `npm start` | Server without watcher |
| `npm test` | API tests (Node test runner against real Postgres) |
| `npm run coverage` | Backend coverage with c8 / V8 |
| `npm run test:load:smoke` | k6 smoke load test |
| `npm run test:load:read` | k6 read-heavy load test |
| `npm run test:load:auth` | k6 authenticated read load test |
| `npm run test:load:writes` | k6 write-heavy load test |
| `npm run test:load:search` | k6 search-heavy load test |

### 4.3 Client-only scripts

From `five_college_connect/client/`:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built bundle locally |
| `npm run lint` | ESLint over `src/` |
| `npm test` | Vitest in run mode |
| `npm run coverage` | Frontend coverage with `@vitest/coverage-v8` |

## 5. Environment Variables

### 5.1 Server (`five_college_connect/server/.env`)

```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
EMAIL_VERIFICATION_BASE_URL=http://localhost:3000/verify-email

DATABASE_URL=postgres://postgres:postgres@localhost:5434/five_college_connect
DB_SSL=false

AUTH_TOKEN_SECRET=replace_me
AUTH_TOKEN_EXPIRES_IN_HOURS=24
EMAIL_VERIFICATION_EXPIRES_IN_HOURS=24

ALLOWED_EMAIL_DOMAINS=umass.edu,amherst.edu,smith.edu,hampshire.edu,mtholyoke.edu

# Optional — when blank, verification links are logged to the server console
MAILJET_API_KEY=
MAILJET_API_SECRET=
EMAIL_FROM=Five College Connect <fivecollegeconnect@gmail.com>
EMAIL_REPLY_TO=fivecollegeconnect@gmail.com
```

Notes:

- `DATABASE_URL` uses port `5434` because `docker-compose.yml` maps the
  container's `5432` to host port `5434` to avoid colliding with native
  Postgres installs.
- If `MAILJET_API_KEY`/`MAILJET_API_SECRET`/`EMAIL_FROM` are blank, the
  backend logs verification links to stdout instead of sending email. This is
  the default for local development.

### 5.2 Client (`five_college_connect/client/.env`)

```env
VITE_API_URL=http://localhost:4000
```

The frontend uses this to build all `/api/...` request URLs through
`client/src/lib/api.js`.

## 6. Ports

| Service | URL | Notes |
|---------|-----|-------|
| Vite client | <http://localhost:3000> | Both dev and Docker paths |
| Express server | <http://localhost:4000> | Both dev and Docker paths |
| Postgres | `localhost:5434` | Container exposes 5432 → host 5434 |

## 7. Database Setup (Manual, optional)

`docker-compose.yml` mounts the schema and seed files into Postgres's init
directory, so a fresh container automatically loads them. The manual path is
only needed if you point the server at a non-Docker Postgres instance:

```bash
psql "$DATABASE_URL" -f five_college_connect/server/database/schema.sql
psql "$DATABASE_URL" -f five_college_connect/server/database/seed.sql
```

To apply the legacy username-uniqueness migration:

```bash
psql "$DATABASE_URL" \
  -f five_college_connect/server/database/migrations/2026-04-14-drop-username-unique.sql
```

## 8. Testing

### 8.1 Backend API tests

The backend tests use the real Express app and the real Dockerized database.

```bash
npm run db:up
cd five_college_connect/server
npm test
```

The suite covers auth, profiles, listings, applications, search, notifications,
and a listing performance regression check.

### 8.2 Frontend unit/component tests

```bash
cd five_college_connect/client
npm test
```

Vitest mocks `fetch` so component tests do not require a running backend.

### 8.3 End-to-end tests (Playwright)

```bash
npm install
npm run test:e2e:install   # one-time Chromium install
npm run test:e2e
```

Playwright boots Postgres, the Express server, and a Vite preview build, then
runs browser-driven tests for landing, login, signup, opportunities, and
profile flows.

### 8.4 Coverage

```bash
npm run db:up
npm run coverage
```

The combined report writes both `lcov.info` files and prints a single overall
percentage. Latest local run:

| Area | Tool | Line coverage |
|------|------|---------------|
| Server | Node test runner + c8 / V8 | ~89.56% |
| Client | Vitest + @vitest/coverage-v8 | ~57.51% |
| **Overall** | Combined LCOV | **~81.45%** |

### 8.5 Load tests (k6)

Optional. `k6` must be installed locally. See
`five_college_connect/server/tests/load/README.md` for the full set. Typical
commands:

```bash
cd five_college_connect/server
npm run test:load:smoke
npm run test:load:read
npm run test:load:auth
npm run test:load:writes
```

## 9. Production Build

### 9.1 Build the client

```bash
cd five_college_connect/client
npm install
npm run build
# Output: five_college_connect/client/dist/
```

The build is a static SPA. `vercel.json` rewrites all paths to `index.html`
so client-side routing works under any static host.

### 9.2 Build the server

The server runs Node directly — there is no transpile step. For a production
container:

```bash
cd five_college_connect/server
npm ci --omit=dev
node src/server.js
```

The included `Dockerfile` does this in one image and uses `node:20-alpine`.

## 10. Deployment

The current public deployment uses a free-tier stack:

| Layer | Provider | Notes |
|-------|----------|-------|
| Frontend | Vercel | Static Vite build |
| Backend | Vercel | Express on Hobby plan |
| Database | Neon | Free Postgres tier |

Live URL: <https://520-group-proj-744s-frontend.vercel.app>

### 10.1 One-time database setup on Neon

Create a Neon project, copy the **pooled** connection string, then load the
schema (do **not** run `seed.sql` against production):

```bash
psql "postgresql://USER:PASS@HOST/neondb?sslmode=require&channel_binding=require" \
  -f five_college_connect/server/database/schema.sql
```

### 10.2 Deploy the backend

1. In Vercel, import this repository as a new project.
2. Set the **Root Directory** to `five_college_connect/server`.
3. Add the environment variables from `.env.production.example`:

   ```env
   PORT=4000
   NODE_ENV=production
   CLIENT_URL=https://<your-frontend>.vercel.app
   EMAIL_VERIFICATION_BASE_URL=https://<your-frontend>.vercel.app/verify-email
   DATABASE_URL=postgresql://...neon...?sslmode=require&channel_binding=require
   DB_SSL=true
   AUTH_TOKEN_SECRET=<32+ random bytes>
   AUTH_TOKEN_EXPIRES_IN_HOURS=24
   ALLOWED_EMAIL_DOMAINS=umass.edu,amherst.edu,smith.edu,hampshire.edu,mtholyoke.edu
   MAILJET_API_KEY=<optional>
   MAILJET_API_SECRET=<optional>
   EMAIL_FROM=Five College Connect <noreply@example.com>
   EMAIL_REPLY_TO=support@example.com
   ```

4. Deploy. Vercel exposes Express via its built-in framework support, so no
   extra adapter code is required.

### 10.3 Deploy the frontend

1. Import the same repository as a second Vercel project.
2. Set the **Root Directory** to `five_college_connect/client`.
3. Add a single environment variable:

   ```env
   VITE_API_URL=https://<your-api>.vercel.app
   ```

4. Deploy.

### 10.4 After both projects exist

1. Update the backend project's `CLIENT_URL` to the frontend's production URL.
2. Update `EMAIL_VERIFICATION_BASE_URL` to
   `https://<your-frontend>.vercel.app/verify-email`.
3. Redeploy the backend so CORS and verification links pick up the new values.

## 11. Smoke-Testing a Deployment

```bash
# Read-only public smoke (safe for production)
K6_BASE_URL=https://<your-api>.vercel.app \
  npm --prefix five_college_connect/server run test:load:smoke

K6_FRONTEND_BASE_URL=https://<your-frontend>.vercel.app \
  npm --prefix five_college_connect/server run test:load:frontend

# Authenticated smoke with a dedicated canary account
K6_BASE_URL=https://<your-api>.vercel.app \
K6_SIGNIN_EMAILS=canary.user@example.edu \
K6_SIGNIN_PASSWORD=<canary password> \
  npm --prefix five_college_connect/server run test:load:auth
```

Do **not** run `test:load:writes` against production — it creates and deletes
real listings.

## 12. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `port is already allocated` on `docker compose up` | Local service on 3000/4000/5434 | Stop the conflicting service or change the host port in `docker-compose.yml` |
| Signin returns "Invalid email or password" for a seeded user | Seed never loaded | `npm run db:reset` |
| Server tests fail with DB connection errors | Postgres not running or wrong port | `npm run db:up`, confirm `.env` uses port 5434 |
| Frontend gets CORS errors | `CLIENT_URL` mismatch | Set the server's `CLIENT_URL` to the exact frontend origin |
| Verification email never arrives | Mailjet keys missing | Check the server console — the link is logged when Mailjet is unconfigured |
| Vercel build fails on backend | Wrong root directory | Set Root Directory to `five_college_connect/server` |
| Vercel build fails on frontend | `VITE_API_URL` missing | Add it as a project env var and redeploy |
| Argon2 install fails on Linux | Missing build tools | `apt install build-essential python3` (the Dockerfile already does this) |

## 13. CI Notes

The Playwright config respects `CI=true`: it disables `.only`, retries failed
tests twice, and writes an HTML report. The backend test suite is safe to run
in CI as long as `DATABASE_URL` points to an isolated Postgres instance and
the schema/seed files are loaded before tests run.
