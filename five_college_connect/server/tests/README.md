# Tests

Different types of tests we should have:

- `unit/` for validators, services, and model helpers
- `integration/` for route/controller/service/database flows
- `e2e/` once the full stack is wired together
This folder is for backend tests.

Right now it includes an integration test for the parts of the backend that are actually implemented:

- `GET /health`
- `POST /api/auth/signin`
- `POST /api/auth/signup`

The auth tests hit the real Express app and the configured PostgreSQL database, so make sure:

- `npm install` has been run in `server`
- `.env` exists in the `server` folder
- `DATABASE_URL` in `.env` points to a real local PostgreSQL database
- the database in `DATABASE_URL` is running
- `schema.sql` and `seed.sql` have already been loaded

At the moment:

- the signin test depends on the seeded user `emily.rodriguez@umass.edu`
- the seeded password is `DemoPass123!`
- the signup test creates and deletes its own temporary test user

To run the tests, either:

1. from the `520_Group_Proj` repo root, run:

```bash
cd five_college_connect/server
npm test
```

2. or stay at the `520_Group_Proj` repo root and run:

```bash
npm --prefix five_college_connect/server test
```
