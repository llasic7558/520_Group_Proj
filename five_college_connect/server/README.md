# Server

This folder contains the backend for the 5-College Connector project.

## Current scope

What is currently implemented:

- auth flow
  - `POST /api/auth/signup`
  - `POST /api/auth/signin`
- listings flow
  - `POST /api/listings`
  - `GET /api/listings`
  - `GET /api/listings/:listingId`
  - `PUT /api/listings/:listingId`
  - `DELETE /api/listings/:listingId`
- PostgreSQL connection setup
- integration tests for auth and listings

## Backend flow

The backend is organized like this:

`routes -> controllers -> validators -> services -> repositories -> database`

Main folders:

- [src/routes](./src/routes): API endpoints
- [src/controllers](./src/controllers): request/response handling
- [src/validators](./src/validators): request validation
- [src/services](./src/services): business logic
- [src/repositories](./src/repositories): SQL/database access
- [src/models](./src/models): backend data models
- [src/config](./src/config): environment and DB config
- [database](./database): schema and seed files
- [tests](./tests): backend integration tests

## Local setup

1. install dependencies

```bash
npm install
```

2. create a `.env` file

```bash
cp .env.example .env
```

3. set `DATABASE_URL` in `.env` to your local PostgreSQL database

Example:

```env
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@127.0.0.1:5432/five_college_connect
DB_SSL=false
AUTH_TOKEN_SECRET=dev_secret_key
```

4. load the schema and seed data

```bash
psql -h 127.0.0.1 -U postgres -d five_college_connect -f database/schema.sql
psql -h 127.0.0.1 -U postgres -d five_college_connect -f database/seed.sql
```

5. start the server

```bash
npm run dev
```

## Client hookup

The client should call these endpoints:

- signup: `POST /api/auth/signup`
- signin: `POST /api/auth/signin`
- get listings: `GET /api/listings`
- get one listing: `GET /api/listings/:listingId`
- create listing: `POST /api/listings`
- update listing: `PUT /api/listings/:listingId`
- delete listing: `DELETE /api/listings/:listingId`

Example local base URL:

```text
http://localhost:4000
```

## Notes

- signup creates the user, profile, skills, courses, and join-table rows in one transaction
- auth currently issues a signed token at signin
- route protection middleware is not fully implemented yet
- the tests README is in [tests/README.md](./tests/README.md)
