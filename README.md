## Five College Connect

### Overview

This project addresses the difficulty students may face when trying to find work or opportunities within the five colleges. Existing platforms target large job boards or general channels, making it very hard for students to stand out or be discovered for opportunities that match their specific skills. Specifically, the UMASS Job Board lacks any type of functionality to apply to jobs or give the employer an idea of who you are. Applications can get lost among many others, and students have to repeatedly fill out forms or send generic resumes for every single job. Our system aims to solve this by creating a centralized platform for students where they can build very detailed profiles highlighting courses, skills, and projects. This allows them to just share their profile with other students or organizations within the school.

The primary users of the platform are students within the Five College community who are seeking tutoring, technical support, project collaborators, startups, or small skill-based jobs. Other stakeholders here would be students who are offering tutoring or technical help. The main objective of the system is to make it easier for students to connect based on their skills, coursework, and interests while reducing the friction you find in current-day job boards and websites. By verifying users through university emails and focusing on profiles, the platform helps build a trusted network that supports collaboration, academic success, and peer-driven learning across the Five Colleges.

### Team Members
- Devin Bowler
- Parthav Elangovan
- Luka Lasic
- Stanley Yang 

### Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | React, JavaScript | Component-based UI; shared language with the backend. |
| Backend | Express.js, Node.js | API in `five_college_connect/server`. |
| Database | PostgreSQL | Structured data, joins, and referential integrity for profiles and related entities. |
| Ops | Docker Compose, Vercel, Neon | Docker Compose for local dev; Vercel + Neon for a true-$0 public pilot at low traffic. |

The frontend app is a **Vite + React** project under **`five_college_connect/client`** using **JavaScript** (`.jsx`). The backend is an **Express 5 + PostgreSQL** service under **`five_college_connect/server`** (Node 20+).

### Getting Started

There are two supported ways to run this project. Pick the one that matches what you're trying to do.

| I want to… | Use this path |
| --- | --- |
| **Just see it run** (demo, evaluate, show someone) | [Users — one-command full stack](#users--one-command-full-stack) |
| **Develop it** (edit code, hot reload, run tests) | [Developers — daily development](#developers--daily-development) |

Both paths share the same Docker Compose file and produce the same running app at `http://localhost:3000`. The only difference is *where* the Node processes run: inside containers (user path) or on your host machine (developer path).

---

#### Users — one-command full stack

**Prerequisites**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or any Docker engine + Docker Compose v2)

**First-time setup**
```bash
git clone <repo-url>
cd Project
```

**Run it**
```bash
docker compose --profile full up
```

Then open **http://localhost:3000** in your browser. The first run takes a minute or two because Docker pulls Postgres and builds the server/client images. Subsequent runs are fast.

**Try it out with seeded credentials**
The database ships with demo users. Log in at `http://localhost:3000/login` with:
- Email: `emily.rodriguez@umass.edu`
- Password: `DemoPass123!`

Or sign up a new account using any `@umass.edu`, `@amherst.edu`, `@smith.edu`, `@hampshire.edu`, or `@mtholyoke.edu` email.

**Stop everything**
```bash
docker compose --profile full down
```

**Reset the database** (wipe all data, re-run schema + seed)
```bash
docker compose down -v && docker compose --profile full up
```

---

#### Developers — daily development

Use this path when you're editing code. It runs Postgres in Docker (so you don't have to install/configure it locally) but runs the Express server and Vite client directly on your host, which gives you instant hot reload and easy debugging.

**Prerequisites**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — used only for Postgres
- [Node.js 20+](https://nodejs.org/) — required by the server's native `--env-file` / `--watch` flags
- Nothing else. You do **not** need to install Postgres locally.

**First-time setup**
```bash
git clone <repo-url>
cd Project

# Copy the env templates
cp five_college_connect/server/.env.example five_college_connect/server/.env
cp five_college_connect/client/.env.example five_college_connect/client/.env

# Install deps for the root, server, and client in one shot
npm run install:all
```

**Run it**
```bash
npm run dev
```

What this does:
1. Starts the Postgres container (waits for its healthcheck to pass)
2. Starts the Express server (`five_college_connect/server`) on port 4000 with `--watch` hot reload
3. Starts the Vite dev server (`five_college_connect/client`) on port 3000 with hot module reload

Both Node processes stream their logs into your terminal with `server` (blue) and `client` (green) prefixes. Ctrl+C cleanly stops both.

Then open **http://localhost:3000** in your browser.

**Useful scripts (run from the repo root)**

| Command | What it does |
| --- | --- |
| `npm run dev` | Daily dev loop: Postgres in Docker, server + client on host with hot reload |
| `npm run up` | Full Docker stack (same as the user path above) |
| `npm run down` | Stop the Docker Postgres container |
| `npm run db:up` | Start only Postgres in Docker (e.g. before running server tests) |
| `npm run db:down` | Stop Postgres without removing the volume |
| `npm run db:reset` | Drop the Postgres volume and re-init schema + seed |

**Server tests** (Node's built-in test runner; hits the real Dockerized DB)
```bash
npm run db:up                          # make sure Postgres is running
cd five_college_connect/server
npm test
```

**Client lint**
```bash
cd five_college_connect/client
npm run lint
```

**Client production build**
```bash
cd five_college_connect/client
npm run build
npm run preview   # optional: serve the built files locally
```

---

#### Free public deployment

If you need a true-$0 hosted version of this project, the current best-fit stack for this repo is:

- **Client:** Vercel static Vite deploy
- **Server:** Vercel Hobby Express deploy
- **Database:** Neon Free Postgres

Why this stack:

- Fly.io is no longer a true free option for new accounts.
- Vercel's official Express support lets the existing backend run as a single function without rewriting the app.
- Neon still offers a free Postgres tier with no credit card required.

**One-time production database setup**
```bash
cd Project
psql "postgresql://USERNAME:PASSWORD@YOUR-NEON-POOLER-HOST/neondb?sslmode=require&channel_binding=require" -f five_college_connect/server/database/schema.sql
```

Do **not** run `seed.sql` against production.

**Deploy the backend**
- Import this repository into Vercel as a new project
- Set the root directory to `five_college_connect/server`
- Add the environment variables shown in [server/.env.production.example](./five_college_connect/server/.env.production.example)

Vercel documents Express support directly, including monorepo root-directory deployment and Hobby-plan limits:
- Express on Vercel: https://vercel.com/docs/frameworks/backend/express
- Vercel monorepos: https://vercel.com/docs/monorepos
- Vercel Hobby plan: https://vercel.com/docs/plans/hobby

**Deploy the frontend**
- Import the same repository into Vercel as a second project
- Set the root directory to `five_college_connect/client`
- Set `VITE_API_URL` using [client/.env.production.example](./five_college_connect/client/.env.production.example) as the template

Vercel's Vite deployment guide is here:
- https://vercel.com/docs/frameworks/frontend/vite

**After the frontend URL exists**
- Set the backend `CLIENT_URL` to your frontend production URL
- Set `EMAIL_VERIFICATION_BASE_URL` to `https://<your-frontend-domain>/verify-email`
- Redeploy the backend

Expected shape:

- frontend: `https://<client>.vercel.app`
- backend: `https://<api>.vercel.app`
- database: Neon pooled connection string with `DB_SSL=true`

---

#### Ports and URLs

| Service | URL / Port | Where it runs |
| --- | --- | --- |
| Client (Vite) | `http://localhost:3000` | Host (dev path) or `fcc-client` container (user path) |
| Server (Express) | `http://localhost:4000` | Host (dev path) or `fcc-server` container (user path) |
| Postgres | `localhost:5434` | `fcc-postgres` container (both paths) |

#### Troubleshooting

- **`port is already allocated` on startup** — something on your machine is already bound to 3000, 4000, or 5434. Stop it, or edit the host-side port in `docker-compose.yml`.
- **Signin returns "Invalid email or password" for a seeded user** — the seed didn't load. Run `npm run db:reset` and try again.
- **Server tests fail with DB connection errors** — make sure Postgres is up (`npm run db:up`) and `five_college_connect/server/.env` has `DATABASE_URL=postgres://postgres:postgres@localhost:5434/five_college_connect`.

### Project Structure
```
Project/
├── docker-compose.yml      # Postgres + server + client (server/client behind `full` profile)
├── package.json            # Root dev scripts (npm run dev, npm run up, npm run db:*)
├── five_college_connect/
│   ├── client/             # React (Vite) app — JavaScript, component-based UI
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── server/             # Express API, services, repositories, PostgreSQL
│       ├── src/
│       ├── database/       # schema.sql + seed.sql (auto-loaded into Postgres on first `up`)
│       ├── tests/          # node:test integration tests (hit the real Dockerized DB)
│       ├── Dockerfile
│       └── package.json
├── docs/
├── .gitignore
└── README.md
```

### Contributing
1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Commit your changes (`git commit -m 'Add some feature'`)
3. Push to the branch (`git push origin feature/your-feature`)
4. Open a Pull Request
