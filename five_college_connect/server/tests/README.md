# Tests

This folder contains the current backend integration tests.

## What is covered

- auth flow
  - health check
  - signin success
  - signin invalid password
  - signup success
- listings flow
  - create listing
  - get listings
  - get one listing
  - update listing
  - delete listing

## Before running tests

Make sure:

- `npm install` has been run in `five_college_connect/server`
- `.env` exists in the `server` folder
- `DATABASE_URL` in `.env` points to a working PostgreSQL database
- `database/schema.sql` and `database/seed.sql` have already been loaded

The tests use the real Express app and the real PostgreSQL database from `.env`.

## Run tests

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
- the signup and listing tests create temporary test data and clean it up
