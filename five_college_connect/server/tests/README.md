# Tests

This folder contains the current backend test suite.

## What is covered

- auth flow
  - health check
  - signin success
  - signin invalid password
  - signup success
- listings flow
  - create listing requires auth
  - create listing
  - get listings
  - search listings by title or listing ID
  - filter listings by category during search
  - get one listing
  - update listing
  - delete listing
- profile flow
  - get profile
  - update profile
- applications flow
  - create application requires auth
  - create application
  - get applications
  - get one application
  - update application
  - delete application
- notifications flow
  - get notifications requires auth
  - create notification when an application is submitted
  - filter unread notifications
  - mark one notification as read
  - mark all notifications as read
- load and scaling checks with `k6`
  - smoke coverage
  - public read-heavy listing traffic
  - authenticated read-heavy profile/application/notification traffic
  - write-heavy listing create/delete pressure

## Before running tests

Make sure:

- `npm install` has been run in `five_college_connect/server`
- `.env` exists in the `server` folder
- `DATABASE_URL` in `.env` points to a working PostgreSQL database
- `database/schema.sql` and `database/seed.sql` have already been loaded

The API tests use the real Express app and the real PostgreSQL database from `.env`.

## Run tests

To run the backend regression suite that should gate pull requests:

Option 1:

```bash
cd five_college_connect/server
npm test
```

Option 2:

```bash
npm --prefix five_college_connect/server test
```

## Run load tests

The load tests live in [load/README.md](./load/README.md).

Typical commands:

```bash
cd five_college_connect/server
npm run test:load:smoke
npm run test:load:read
npm run test:load:auth
npm run test:load:writes
```

## Run smoke tests against a live deployment

The same `k6` smoke scripts can also hit a deployed backend and frontend.

Public smoke only:

```bash
cd five_college_connect/server
K6_BASE_URL=https://your-api-project.vercel.app npm run test:load:smoke
K6_FRONTEND_BASE_URL=https://your-client-site.vercel.app npm run test:load:frontend
```

Authenticated smoke with a canary production account:

```bash
cd five_college_connect/server
K6_BASE_URL=https://your-api-project.vercel.app \
K6_SIGNIN_EMAILS=canary.user@example.edu \
K6_SIGNIN_PASSWORD=your-canary-password \
npm run test:load:auth
```

`K6_SIGNIN_EXPECTED_USER_IDS` is optional. Set it if you want the auth smoke to
also verify the exact user ID returned after signin.

The GitHub Actions production smoke workflow expects:

- repository variables: `PRODUCTION_API_URL`, `PRODUCTION_FRONTEND_URL`
- optional repository secrets for authenticated smoke:
  `PRODUCTION_TEST_EMAIL`, `PRODUCTION_TEST_PASSWORD`, `PRODUCTION_TEST_USER_ID`

## Notes

- the signin test uses seeded users like `emily.rodriguez@umass.edu` and `sarah.johnson@umass.edu`
- the seeded password is `DemoPass123!`
- the signup, listing, search, profile, application, and notification tests create temporary test data and clean it up when needed
- the protected-route tests also check that the wrong user cannot update someone else's listing, profile, or application
- the `k6` suite defaults to seeded local users for signin and assumes the server is already running
- for production smoke, prefer a dedicated canary account and keep those credentials in GitHub Secrets rather than in `.env`
