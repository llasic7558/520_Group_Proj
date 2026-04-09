# Server

This folder contains the backend for the 5-College Connector project.

## Current scope

What is currently implemented:

- auth flow
  - `POST /api/auth/signup`
  - `POST /api/auth/signin`
- profile flow
  - `GET /api/profiles/:userId`
  - `PUT /api/profiles/:userId`
- listings flow
  - `POST /api/listings`
  - `GET /api/listings`
  - `GET /api/listings/:listingId`
  - `PUT /api/listings/:listingId`
  - `DELETE /api/listings/:listingId`
- applications flow
  - `POST /api/applications`
  - `GET /api/applications`
  - `GET /api/applications/:applicationId`
  - `PUT /api/applications/:applicationId`
  - `DELETE /api/applications/:applicationId`
- PostgreSQL connection setup
- integration tests for auth, profiles, listings, and applications

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
- get profile: `GET /api/profiles/:userId`
- update profile: `PUT /api/profiles/:userId`
- get listings: `GET /api/listings`
- get one listing: `GET /api/listings/:listingId`
- create listing: `POST /api/listings`
- update listing: `PUT /api/listings/:listingId`
- delete listing: `DELETE /api/listings/:listingId`
- create application: `POST /api/applications`
- get applications: `GET /api/applications`
- get one application: `GET /api/applications/:applicationId`
- update application: `PUT /api/applications/:applicationId`
- delete application: `DELETE /api/applications/:applicationId`

Example local base URL:

```text
http://localhost:4000
```

Protected-route note:

- `POST`/`PUT`/`DELETE` routes for listings and applications, plus `PUT /api/profiles/:userId`, now require `Authorization: Bearer <authToken>`
- the current client already supports this if requests go through [client/src/lib/api.js](../client/src/lib/api.js), which automatically attaches the stored token
- if any frontend code uses raw `fetch(...)` instead of the shared API helper for protected routes, it will need to add the bearer token manually

## Notes

- signup creates the user, profile, skills, courses, and join-table rows in one transaction
- profile data can start mostly blank at signup and be completed later with `PUT /api/profiles/:userId`, like how bio is completed after the sign-up flow
- auth currently issues a signed token at signin
- protected write routes now require `Authorization: Bearer <authToken>`
- listing/profile writes enforce owner-or-admin checks
- application create/update/delete enforces the signed-in applicant, and application reads are limited to the applicant, the listing owner, or an admin
- the tests README is in [tests/README.md](./tests/README.md)
