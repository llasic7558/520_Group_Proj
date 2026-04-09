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

## Before running tests

Make sure:

- `npm install` has been run in `five_college_connect/server`
- `.env` exists in the `server` folder
- `DATABASE_URL` in `.env` points to a working PostgreSQL database
- `database/schema.sql` and `database/seed.sql` have already been loaded

The integration tests use the real Express app and the real PostgreSQL database from `.env`.

## Run tests

To generally run all tests in the `tests` folder:

Option 1:

```bash
cd five_college_connect/server
npm test
```

Option 2:

```bash
npm --prefix five_college_connect/server test
```

## Notes

- the signin test uses the seeded user `emily.rodriguez@umass.edu`
- the seeded password is `DemoPass123!`
- the signup, listing, profile, and application tests create temporary test data and clean it up when needed
- the protected-route tests also check that the wrong user cannot update someone else's listing, profile, or application
