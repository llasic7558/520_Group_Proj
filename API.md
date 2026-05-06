# API Documentation — Five College Connect

This document describes every HTTP endpoint exposed by the Express backend
(`five_college_connect/server/src/routes`). All routes are mounted under
`/api` except for the system `/health` check.

## Conventions

- **Base URL (local):** `http://localhost:4000`
- **Base URL (production):** the Vercel project URL of the backend
- **Content type:** `application/json` for all request and response bodies
- **Authentication:** `Authorization: Bearer <authToken>` where indicated.
  Tokens are issued by `/api/auth/signup` and `/api/auth/signin`.
- **Errors:** every error response has the shape

  ```json
  { "message": "Human-readable error message", "details": null }
  ```

  The HTTP status code communicates the failure category (400/401/403/404/409/500).

- **Verified-email gate:** routes marked `verified email required` reject
  requests with `403 EMAIL_NOT_VERIFIED` when the signed-in user has not yet
  confirmed their university email.

## Endpoint Index

| Method | Path | Auth | Verified email |
|--------|------|------|----------------|
| GET | `/health` | — | — |
| POST | `/api/auth/signup` | — | — |
| POST | `/api/auth/signin` | — | — |
| GET | `/api/auth/verify-email` | — | — |
| POST | `/api/auth/verify-email/resend` | required | — |
| GET | `/api/profiles/:userId` | — | — |
| PUT | `/api/profiles/:userId` | required | — |
| GET | `/api/listings` | — | — |
| POST | `/api/listings` | required | required |
| GET | `/api/listings/:listingId` | — | — |
| PUT | `/api/listings/:listingId` | required | — |
| DELETE | `/api/listings/:listingId` | required | — |
| POST | `/api/listings/:listingId/reopen` | required | — |
| DELETE | `/api/listings/:listingId/permanent` | required | — |
| GET | `/api/applications` | required | — |
| POST | `/api/applications` | required | required |
| GET | `/api/applications/:applicationId` | required | — |
| PUT | `/api/applications/:applicationId` | required | — |
| PATCH | `/api/applications/:applicationId/status` | required | — |
| DELETE | `/api/applications/:applicationId` | required | — |
| GET | `/api/notifications` | required | — |
| PATCH | `/api/notifications/:notificationId/read` | required | — |
| PATCH | `/api/notifications/read-all` | required | — |
| GET | `/api/search/listings` | — | — |

---

## System

### `GET /health`

Liveness probe. Reports server status and a quick database round-trip latency.

**Response 200**

```json
{
  "status": "ok",
  "service": "five-college-connector-server",
  "database": {
    "configured": true,
    "sslEnabled": false,
    "status": "ok",
    "latencyMs": 12
  }
}
```

Returns `503` with `status: "degraded"` when the database is unreachable.

---

## Auth

### `POST /api/auth/signup`

Creates a user, profile, related skill rows, and related course rows in a
single transaction. Sends an email-verification link (or logs it to stdout in
local development).

**Request body**

```json
{
  "email": "student@umass.edu",
  "username": "student",
  "password": "DemoPass123!",
  "role": "student",
  "profile": {
    "fullName": "Stu Dent",
    "bio": "",
    "college": "UMass Amherst",
    "major": "Computer Science",
    "graduationYear": 2027,
    "interests": "",
    "availability": "",
    "lookingFor": "",
    "profileImageUrl": "",
    "skills": [
      {
        "name": "React",
        "category": "Frameworks",
        "proficiencyLevel": "intermediate",
        "isOfferingHelp": true,
        "isSeekingHelp": false
      }
    ],
    "courses": [
      {
        "courseCode": "COMPSCI 520",
        "courseName": "Software Engineering",
        "institution": "UMass Amherst",
        "status": "in-progress",
        "grade": ""
      }
    ]
  }
}
```

**Response 201**

```json
{
  "message": "Account created successfully",
  "authToken": "<token>",
  "user": {
    "id": "uuid",
    "email": "student@umass.edu",
    "username": "student",
    "role": "student",
    "emailVerified": false
  },
  "profile": { /* full profile with skills + courses */ }
}
```

**Errors**

- `400` — missing fields, password under 8 characters, non-Five-Colleges email,
  oversized `profileImageUrl`
- `409` — an account with that email already exists

### `POST /api/auth/signin`

Validates email + password, returns a fresh auth token and the user's profile.

**Request body**

```json
{ "email": "student@umass.edu", "password": "DemoPass123!" }
```

**Response 200**

```json
{
  "message": "Signed in successfully",
  "authToken": "<token>",
  "user": { /* same shape as signup */ },
  "profile": { /* full profile with skills + courses */ }
}
```

**Errors**

- `400` — missing email or password
- `401` — invalid credentials

### `GET /api/auth/verify-email?token=<token>`

Validates a verification token, marks the user's email as verified, and
invalidates remaining tokens for that user.

**Response 200**

```json
{
  "message": "Email verified successfully",
  "user": { /* user with emailVerified: true */ },
  "profile": { /* full profile */ }
}
```

**Errors**

- `400` — token missing, invalid, expired, or already used

### `POST /api/auth/verify-email/resend`

Authenticated. Rotates the active verification token for the signed-in user
and re-sends the verification email.

**Response 200**

```json
{ "message": "Verification email sent successfully" }
```

**Errors**

- `404` — user not found
- `409` — email is already verified

---

## Profiles

### `GET /api/profiles/:userId`

Returns the full profile for a user, including skills and completed/in-progress
courses through the `user_skills` and `user_courses` join tables.

**Response 200**

```json
{
  "profile": {
    "profileId": "uuid",
    "userId": "uuid",
    "fullName": "Stu Dent",
    "bio": "...",
    "college": "UMass Amherst",
    "major": "Computer Science",
    "graduationYear": 2027,
    "interests": "...",
    "availability": "...",
    "lookingFor": "...",
    "profileImageUrl": "",
    "skills": [
      {
        "userSkillId": "uuid",
        "userId": "uuid",
        "profileId": "uuid",
        "skillId": "uuid",
        "name": "React",
        "category": "Frameworks",
        "proficiencyLevel": "advanced",
        "isOfferingHelp": true,
        "isSeekingHelp": false
      }
    ],
    "courses": [
      {
        "userCourseId": "uuid",
        "courseId": "uuid",
        "courseCode": "COMPSCI 520",
        "courseName": "Software Engineering",
        "institution": "UMass Amherst",
        "status": "in-progress",
        "grade": ""
      }
    ]
  }
}
```

**Errors**

- `404` — profile not found

### `PUT /api/profiles/:userId`

Authenticated. Replaces profile fields and rewrites the user's skills and
courses to match the payload. The signed-in user must be the owner or an
admin.

**Request body** — same shape as the `profile` portion of the signup payload.

**Response 200**

```json
{
  "message": "Profile updated successfully",
  "profile": { /* refreshed profile with skills + courses */ }
}
```

**Errors**

- `400` — `college` missing, `graduationYear` not numeric, `profileImageUrl`
  exceeds 500,000 characters
- `403` — caller is not the profile owner or an admin
- `404` — profile not found

---

## Listings

### `GET /api/listings`

Public list with optional filters. Returns up to 50 results.

**Query parameters**

| Name | Notes |
|------|-------|
| `category` | `tutoring`, `project`, `job`, `study_group`, or `all` |
| `query` | Case-insensitive title substring; if a UUID is provided, exact `listingId` match |
| `status` | `open`/`published` (treated equivalently), `closed` |
| `createdByUserId` | UUID — filter to a single owner's listings |
| `limit` | 1–50, default 20 |

**Response 200**

```json
{
  "items": [
    {
      "listingId": "uuid",
      "createdByUserId": "uuid",
      "title": "CS 187 Data Structures Tutor Needed",
      "description": "...",
      "category": "tutoring",
      "contactMethod": "profile",
      "contactDetails": "",
      "bannerImageUrl": "",
      "customColor": "",
      "status": "open",
      "expirationDate": "2026-05-31",
      "createdAt": "2026-04-02T16:00:00.000Z",
      "updatedAt": "2026-04-02T16:00:00.000Z",
      "skills": [
        {
          "listingSkillId": "uuid",
          "listingId": "uuid",
          "skillId": "uuid",
          "name": "Java",
          "category": "Languages",
          "requirementType": "required"
        }
      ],
      "attachments": [],
      "creator": {
        "userId": "uuid",
        "emailVerified": true,
        "teacherBadge": false,
        "profile": { /* creator profile */ }
      }
    }
  ]
}
```

### `POST /api/listings`

Authenticated and verified-email-required. Creates a listing plus its skill
links and attachment rows in one transaction.

**Request body**

```json
{
  "title": "Build a planner",
  "description": "Looking for collaborators on a campus planner project.",
  "category": "project",
  "contactMethod": "email",
  "contactDetails": "you@umass.edu",
  "bannerImageUrl": "",
  "customColor": "#88302D",
  "status": "open",
  "expirationDate": "2026-12-31",
  "skills": [
    { "name": "React", "category": "Frameworks", "requirementType": "required" }
  ],
  "attachments": [
    { "fileUrl": "https://example.com/spec.pdf", "fileType": "application/pdf" }
  ]
}
```

`createdByUserId` is taken from the auth token — the client does not send it.

**Response 201**

```json
{
  "message": "Listing created successfully",
  "listing": { /* same shape as GET /api/listings items */ }
}
```

**Errors**

- `400` — `title` or `category` missing
- `401` — missing/invalid bearer token
- `403` — email not verified (`details.code: "EMAIL_NOT_VERIFIED"`)

### `GET /api/listings/:listingId`

Public detail view. Returns one listing with skills, attachments, creator, and
creator profile.

**Response 200**

```json
{ "listing": { /* same shape as GET /api/listings item */ } }
```

**Errors**

- `404` — listing not found

### `PUT /api/listings/:listingId`

Authenticated, owner-or-admin. Replaces the listing and rewrites its skills
and attachments.

**Request body** — same shape as `POST /api/listings`.

**Response 200**

```json
{
  "message": "Listing updated successfully",
  "listing": { /* refreshed listing with skills + attachments + creator */ }
}
```

**Errors**

- `400` — `title` or `category` missing
- `403` — caller is not the owner or an admin
- `404` — listing not found

### `DELETE /api/listings/:listingId`

Authenticated, owner-or-admin. Soft-closes the listing by setting
`status = "closed"`. Applications and history are preserved.

**Response 200**

```json
{
  "message": "Listing closed successfully",
  "listing": { /* listing with status: "closed" */ }
}
```

### `POST /api/listings/:listingId/reopen`

Authenticated, owner-or-admin. Sets `status = "open"` for a previously closed
listing.

**Response 200**

```json
{
  "message": "Listing reopened successfully",
  "listing": { /* listing with status: "open" */ }
}
```

### `DELETE /api/listings/:listingId/permanent`

Authenticated, owner-or-admin. Hard-deletes the listing and cascades through
`listing_skills`, `listing_attachments`, and `applications`.

**Response 200**

```json
{ "message": "Listing permanently deleted successfully" }
```

---

## Applications

### `GET /api/applications`

Authenticated. Lists applications visible to the caller:

- An applicant sees their own applications (`applicantUserId` is forced to the
  caller).
- A listing owner sees applications for their listings (when `listingId` is
  supplied).
- An admin sees everything.

**Query parameters**

| Name | Notes |
|------|-------|
| `listingId` | UUID — narrows results to one listing |
| `applicantUserId` | UUID — only honored for admins; otherwise must equal the caller |
| `status` | `pending`, `accepted`, `rejected` |
| `limit` | 1–50, default 20 |

**Response 200**

```json
{
  "items": [
    {
      "applicationId": "uuid",
      "listingId": "uuid",
      "applicantUserId": "uuid",
      "message": "Hi, I'd love to help.",
      "status": "pending",
      "submittedAt": "2026-04-24T12:00:00.000Z"
    }
  ]
}
```

**Errors**

- `403` — non-admin tried to filter by another user's `applicantUserId`

### `POST /api/applications`

Authenticated and verified-email-required. Creates an application and, when
the applicant is not the listing owner, a `new_application` notification for
the owner.

**Request body**

```json
{ "listingId": "uuid", "message": "Short pitch / introduction." }
```

**Response 201**

```json
{
  "message": "Application created successfully",
  "application": { /* same shape as GET items */ }
}
```

**Errors**

- `400` — `listingId` missing
- `403` — email not verified
- `404` — listing not found

### `GET /api/applications/:applicationId`

Authenticated. Visible only to the applicant, the listing owner, or an admin.

### `PUT /api/applications/:applicationId`

Authenticated, applicant-or-admin. Updates `message` and `status`.

### `PATCH /api/applications/:applicationId/status`

Authenticated, listing-owner-or-admin. Accepts/rejects an application without
needing the full payload.

**Request body**

```json
{ "status": "accepted" }
```

Allowed statuses: `pending`, `accepted`, `rejected`.

**Response 200**

```json
{
  "message": "Application status updated successfully",
  "application": { /* updated application */ }
}
```

**Errors**

- `400` — invalid status
- `403` — caller does not own the listing
- `404` — application not found

### `DELETE /api/applications/:applicationId`

Authenticated, applicant-or-admin.

**Response 200**

```json
{ "message": "Application deleted successfully" }
```

---

## Notifications

### `GET /api/notifications`

Authenticated. Returns the signed-in user's notifications and their unread
count.

**Query parameters**

| Name | Notes |
|------|-------|
| `unreadOnly` | `"true"` to filter to unread |
| `limit` | 1–50, default 20 |

**Response 200**

```json
{
  "items": [
    {
      "notificationId": "uuid",
      "userId": "uuid",
      "type": "new_application",
      "message": "Someone applied to your listing \"...\"",
      "isRead": false,
      "createdAt": "2026-04-24T12:00:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

### `PATCH /api/notifications/:notificationId/read`

Authenticated. Marks a single notification as read. The user must own the
notification (otherwise the row is treated as not found).

**Response 200**

```json
{
  "message": "Notification marked as read",
  "notification": { /* updated notification */ }
}
```

**Errors**

- `404` — notification not found or not owned by the caller

### `PATCH /api/notifications/read-all`

Authenticated. Marks every unread notification for the caller as read.

**Response 200**

```json
{ "message": "Notifications marked as read", "updatedCount": 7 }
```

---

## Search

### `GET /api/search/listings`

Public. Same parameters and response shape as `GET /api/listings`. Exists as a
dedicated route so search-specific load tests and dashboards can isolate the
search path even though both endpoints currently delegate to the same service.

**Query parameters** — identical to `GET /api/listings`.

**Response 200** — identical to `GET /api/listings`.

---

## Authentication Token Format

Tokens are HMAC-signed payloads, not full JWTs. Each token is
`<base64url(payload)>.<hex hmac-sha256>` where the payload contains:

```json
{
  "userId": "uuid",
  "email": "student@umass.edu",
  "role": "student",
  "expiresAt": 1735689600000
}
```

The HMAC secret is `AUTH_TOKEN_SECRET` from the server environment. The
default expiry is 24 hours and is configurable via
`AUTH_TOKEN_EXPIRES_IN_HOURS`.

## Authorization Rules (Summary)

| Resource | Read | Write |
|----------|------|-------|
| Profile | Public | Owner or admin |
| Listing | Public | Owner or admin; create requires verified email |
| Application | Applicant, listing owner, or admin | Applicant or admin (create requires verified email); status update requires listing owner or admin |
| Notification | Owner only | Owner only |

## Common Response Codes

| Code | When |
|------|------|
| 200 | Successful read or update |
| 201 | Successful create |
| 400 | Validation failure (missing fields, bad format) |
| 401 | Missing/invalid/expired auth token |
| 403 | Authenticated but not allowed (ownership, verified-email gate) |
| 404 | Resource not found or hidden from caller |
| 409 | Conflict (duplicate email, already verified) |
| 503 | `/health` only — database unreachable |
