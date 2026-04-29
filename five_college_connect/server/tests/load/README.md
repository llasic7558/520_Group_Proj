# Load Tests

This folder contains `k6` scripts for exercising the current API under sustained traffic.

## What is covered

- `smoke.js`
  - basic health check
  - basic listings read
  - single listing detail read
- `read-heavy.js`
  - public listing browse traffic
  - filtered listing reads
  - listing detail fan-out under higher arrival rates
- `search-heavy.js`
  - dedicated `/api/search/listings` traffic
  - category + keyword filtering against a larger seeded dataset
  - end-to-end latency checks for the scalable search path
- `authenticated-read.js`
  - repeated signin in `setup()`
  - authenticated profile reads
  - authenticated application list reads
  - authenticated notification reads
- `write-heavy.js`
  - repeated authenticated listing create/get/delete cycles
  - write-path latency under concurrent users

## Before running

Make sure:

- the database is running
- the Express server is running on `http://127.0.0.1:4000` or set `K6_BASE_URL`
- the seed data has been loaded
- `k6` is installed on your machine

For the dedicated search scenario, seed the larger search dataset first:

```bash
cd five_college_connect/server
npm run test:load:search:seed
```

Typical local setup:

```bash
npm run db:up
cd five_college_connect/server
npm start
```

In a second terminal:

```bash
cd five_college_connect/server
npm run test:load:smoke
```

## Run against production or another deployed environment

These scripts are safe to point at a deployed service as long as you choose the
right scenario:

- `smoke.js` and `frontend-pages.js` are read-only and safe for production
- `authenticated-read.js` is also production-safe if you provide a dedicated
  canary account with read access
- `write-heavy.js` should stay off production because it creates and deletes data

Examples:

```bash
K6_BASE_URL=https://your-api-project.vercel.app npm run test:load:smoke
K6_FRONTEND_BASE_URL=https://your-client-site.vercel.app npm run test:load:frontend
K6_BASE_URL=https://your-api-project.vercel.app \
K6_SIGNIN_EMAILS=canary.user@example.edu \
K6_SIGNIN_PASSWORD=your-canary-password \
K6_VUS=1 \
K6_DURATION=15s \
npm run test:load:auth
```

If you want signin checks to verify the exact account identity, also set:

```bash
K6_SIGNIN_EXPECTED_USER_IDS=uuid-of-your-canary-user
```

## Run commands

```bash
cd five_college_connect/server
npm run test:load:smoke
npm run test:load:read
npm run test:load:search
npm run test:load:auth
npm run test:load:writes
```

## Useful environment variables

```bash
K6_BASE_URL=http://127.0.0.1:4000
K6_VUS=12
K6_DURATION=2m
K6_P95_MS=1000
K6_FAILED_RATE=0.02
K6_SIGNIN_PASSWORD=DemoPass123!
K6_SIGNIN_EMAILS=emily.rodriguez@umass.edu,michael.chen@umass.edu
K6_SIGNIN_EXPECTED_USER_IDS=a1000000-0000-0000-0000-000000000001,a1000000-0000-0000-0000-000000000002
K6_SEARCH_CASES=project|Campus Search Performance,tutoring|Research Match,job|Data Structures Help,study_group|Design Critique
K6_SEARCH_LIMIT=20
```

Examples:

```bash
K6_VUS=16 K6_DURATION=3m npm run test:load:auth
K6_START_RATE=5 K6_RATE_STAGE_2=25 K6_RATE_STAGE_3=50 npm run test:load:read
K6_VUS=40 K6_DURATION=60s npm run test:load:search
K6_VUS=6 K6_DURATION=90s npm run test:load:writes
```

## Search dataset seeding

The `/api/search/listings` load test is intended to run against a larger
repeatable dataset than the demo seed.

Seed it:

```bash
cd five_college_connect/server
npm run test:load:search:seed
```

Remove it:

```bash
cd five_college_connect/server
npm run test:load:search:cleanup
```

Useful seed environment variables:

```bash
SEARCH_LOAD_LISTING_COUNT=800
SEARCH_LOAD_PREFIX=K6 Search Load Listing
SEARCH_LOAD_OWNER_EMAIL=emily.rodriguez@umass.edu
SEARCH_LOAD_TERMS=Campus Search Performance,Research Match,Data Structures Help,Design Critique
SEARCH_LOAD_CATEGORIES=project,tutoring,job,study_group
```

## What will likely break first

- `GET /api/listings` currently fans out into extra queries for skills, attachments, creator, and creator profile for every listing. That means list latency will climb quickly as row counts or page size grow.
- Title filtering uses `ILIKE '%query%'`, which will stop using the current B-tree indexes effectively once the listings table gets larger.
- `POST /api/auth/signin` is CPU-heavy because it verifies Argon2 password hashes. Login bursts can saturate the Node process before the database becomes the bottleneck.
- `GET /api/notifications` always performs two database calls: one to fetch the page and one to count unread items. Under load that doubles read pressure on the notifications table.
- Every request is logged synchronously through `console`, which adds avoidable overhead at higher request rates.

## High-value improvements after measuring

- Replace the listing N+1 pattern with one joined query or a small fixed number of batched queries.
- Add a trigram index for title search if partial matching stays part of the browse flow.
- Add rate limiting or edge caching around signin and public browse endpoints.
- Collapse notification list and unread count into one query, or cache unread counts separately.
- Add request timing, database timing, and pool saturation metrics so a failing k6 run points to the real bottleneck instead of just showing slower latency.

## Current gap

- Search now has a dedicated `/api/search/listings` route and a large-dataset
  load test, but the repo still needs production metrics if you want the test
  to explain *why* a slowdown happens instead of only showing that it happened.
