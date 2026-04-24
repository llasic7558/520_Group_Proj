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
- notifications flow
  - `GET /api/notifications`
  - `PATCH /api/notifications/:notificationId/read`
  - `PATCH /api/notifications/read-all`
- PostgreSQL connection setup
- API tests for auth, profiles, listings, applications, search, and notifications

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
- [tests](./tests): backend API tests

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
EMAIL_VERIFICATION_BASE_URL=http://localhost:3000/verify-email
```

4. load the schema and seed data

```bash
psql -h 127.0.0.1 -U postgres -d five_college_connect -f database/schema.sql
psql -h 127.0.0.1 -U postgres -d five_college_connect -f database/seed.sql
```

If you already created your local database before a schema change, run any needed migration files too.
For example, after loading your `.env`:

```bash
set -a
source .env
set +a
psql "$DATABASE_URL" -f database/migrations/2026-04-14-drop-username-unique.sql
```

5. start the server

```bash
npm run dev
```

## Email verification

The server can send real verification emails through Mailjet.

1. create a Mailjet account
2. add and verify a sender address in Mailjet
3. create a Mailjet API key and secret
4. add these variables to `.env`

```env
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_API_SECRET=your_mailjet_api_secret
EMAIL_FROM=Five College Connect <your-verified-sender@example.com>
EMAIL_REPLY_TO=support@example.com
EMAIL_VERIFICATION_BASE_URL=http://localhost:3000/verify-email
```

If `MAILJET_API_KEY`, `MAILJET_API_SECRET`, and `EMAIL_FROM` are not set, the
backend falls back to logging the verification link in the server console. That
keeps local tests and local development working without a live mail provider.

## Email verification flow

Current backend endpoints:

- verify email: `GET /api/auth/verify-email?token=...`
- resend verification email: `POST /api/auth/verify-email/resend`

Recommended local frontend URL:

```text
http://localhost:3000/verify-email
```

Temporary backend-only testing URL:

```text
http://localhost:4000/api/auth/verify-email
```

How the ideal flow works:

1. signup creates an unverified user and saves a verification token
2. the backend emails a link built from `EMAIL_VERIFICATION_BASE_URL`
3. the user clicks the frontend route such as `http://localhost:3000/verify-email?token=...`
4. the frontend reads the `token` from the URL and calls `GET /api/auth/verify-email?token=...`
5. the backend validates the token and updates `users.email_verified` to `TRUE`

Before the frontend `/verify-email` page exists, you can temporarily point
`EMAIL_VERIFICATION_BASE_URL` at the backend route:

```env
EMAIL_VERIFICATION_BASE_URL=http://localhost:4000/api/auth/verify-email
```

That makes the email link go straight to the backend so the full verification
flow can be tested without client work.

Note:

- after the frontend `/verify-email` page is implemented, switch it back to
  `EMAIL_VERIFICATION_BASE_URL=http://localhost:3000/verify-email`

For quick local email testing with Mailjet, verify a sender address in your
Mailjet account and then use that exact address in `EMAIL_FROM`. For example:

```env
EMAIL_FROM=Five College Connect <yourverifiedemail@gmail.com>
```

If that inbox does not use one of the domains in `ALLOWED_EMAIL_DOMAINS`, you
may need to temporarily add its domain in `.env` for local testing. For
example:

```env
ALLOWED_EMAIL_DOMAINS=umass.edu,amherst.edu,smith.edu,hampshire.edu,mtholyoke.edu,gmail.com
```

After testing, change `ALLOWED_EMAIL_DOMAINS` back to the intended set of
allowed domains.

## Client hookup

The client should call these endpoints:

- signup: `POST /api/auth/signup`
- signin: `POST /api/auth/signin`
- verify email: `GET /api/auth/verify-email?token=...`
- resend verification email: `POST /api/auth/verify-email/resend`
- get profile: `GET /api/profiles/:userId`
- update profile: `PUT /api/profiles/:userId`
- get listings: `GET /api/listings`
- get one listing: `GET /api/listings/:listingId`
- create listing: `POST /api/listings`
- update listing: `PUT /api/listings/:listingId`
- delete listing: `DELETE /api/listings/:listingId`
- search listings: `GET /api/listings?category=...&query=...&limit=...`
- create application: `POST /api/applications`
- get applications: `GET /api/applications`
- get one application: `GET /api/applications/:applicationId`
- update application: `PUT /api/applications/:applicationId`
- delete application: `DELETE /api/applications/:applicationId`
- get notifications: `GET /api/notifications`
- mark one notification as read: `PATCH /api/notifications/:notificationId/read`
- mark all notifications as read: `PATCH /api/notifications/read-all`

Example local base URL:

```text
http://localhost:4000
```

Protected-route note:

- `POST`/`PUT`/`DELETE` routes for listings and applications, plus `PUT /api/profiles/:userId`, now require `Authorization: Bearer <authToken>`
- `POST /api/listings` and `POST /api/applications` also require a verified email address
- the current client already supports this if requests go through [client/src/lib/api.js](../client/src/lib/api.js), which automatically attaches the stored token
- if any frontend code uses raw `fetch(...)` instead of the shared API helper for protected routes, it will need to add the bearer token manually

## Notes

- signup creates the user, profile, skills, courses, and join-table rows in one transaction
- profile data can start mostly blank at signup and be completed later with `PUT /api/profiles/:userId`, like how bio is completed after the sign-up flow
- auth currently issues a signed token at signin
- protected write routes now require `Authorization: Bearer <authToken>`
- unverified users cannot create listings or submit applications
- listing/profile writes enforce owner-or-admin checks
- application create/update/delete enforces the signed-in applicant, and application reads are limited to the applicant, the listing owner, or an admin
- the tests README is in [tests/README.md](./tests/README.md)
