# Server

This folder contains the backend for the 5-College Connector project.

This is meant to help people understand:

- what is implemented right now
- how the frontend is supposed to talk to the backend
- how the signup/signin flow works
- what each backend folder is for
- what the backend currently expects from the database

## Current Scope

The main backend flow I have implemented so far is:

- `POST /api/auth/signup`
- `POST /api/auth/signin`

Right now, signup creates:

- a user account
- a profile
- related skill records
- related course records
- relationship rows for profile skills
- relationship rows for profile courses

There are routes and placeholders for other features too, but they are not fully implemented yet:

- listings
- applications
- study groups
- notifications
- search

For now, the auth/profile flow is the main working backend path.

## Backend Flow

The request flow I am using is:

`route -> controller -> validator -> service -> repository -> database`

For signup, that means:

1. the frontend sends `POST /api/auth/signup`
2. [auth.routes.js](./src/routes/auth.routes.js) maps that request to `signUp`
3. [auth.controller.js](./src/controllers/auth.controller.js) validates the incoming request body
4. [account.service.js](./src/services/account.service.js) handles the signup logic
5. repositories insert or read data from PostgreSQL
6. the controller sends the final JSON response back to the frontend

## API Endpoints

### `POST /api/auth/signup`

This creates a user and their initial profile in one request.

Expected request body:

```json
{
  "email": "stanleyyang@umass.edu",
  "username": "stanley",
  "password": "strongpassword",
  "role": "student",
  "profile": {
    "fullName": "Stanley Yang",
    "bio": "Looking for project collaborators",
    "college": "UMass Amherst",
    "major": "Computer Science",
    "graduationYear": 2027,
    "skills": [
      {
        "name": "JavaScript",
        "category": "Programming",
        "proficiencyLevel": "advanced",
        "isOfferingHelp": true,
        "isSeekingHelp": false
      }
    ],
    "courses": [
      {
        "courseCode": "CS 320",
        "courseName": "Software Engineering",
        "institution": "UMass Amherst",
        "status": "completed",
        "grade": "A"
      }
    ],
    "interests": "Startups, tutoring",
    "availability": "Weekends",
    "lookingFor": "Project teammates",
    "profileImageUrl": ""
  }
}
```

Successful response:

```json
{
  "message": "Account created successfully",
  "authToken": "<token>",
  "user": {
    "id": "uuid",
    "email": "stanleyyang@umass.edu",
    "username": "stanley",
    "role": "student",
    "emailVerified": false
  },
  "profile": {
    "profileId": "uuid",
    "userId": "uuid",
    "fullName": "Stanley Yang",
    "bio": "Looking for project collaborators",
    "college": "UMass Amherst",
    "major": "Computer Science",
    "graduationYear": 2027,
    "skills": [],
    "courses": [],
    "coursesTaken": [],
    "interests": "Startups, tutoring",
    "availability": "Weekends",
    "lookingFor": "Project teammates",
    "profileImageUrl": ""
  }
}
```

Note:

- the profile response includes direct profile fields plus related skill/course data
- `coursesTaken` is currently just an alias of `courses`

### `POST /api/auth/signin`

This logs in an existing user.

Expected request body:

```json
{
  "email": "student@umass.edu",
  "password": "strongpassword"
}
```

Successful response:

```json
{
  "message": "Signed in successfully",
  "authToken": "<token>",
  "user": {
    "id": "uuid",
    "email": "student@umass.edu",
    "username": "stanley",
    "role": "student",
    "emailVerified": false
  },
  "profile": {
    "profileId": "uuid",
    "userId": "uuid",
    "fullName": "Stanley Yang",
    "bio": "Looking for project collaborators",
    "college": "UMass Amherst",
    "major": "Computer Science",
    "graduationYear": 2027,
    "skills": [],
    "courses": [],
    "coursesTaken": [],
    "interests": "Startups, tutoring",
    "availability": "Weekends",
    "lookingFor": "Project teammates",
    "profileImageUrl": ""
  }
}
```

## Notes For Frontend

Main things to know:

- call `POST /api/auth/signup` to create both the account and the initial profile
- call `POST /api/auth/signin` to log in
- signup expects account info at the top level and profile info inside `profile`
- signin only needs `email` and `password`

For signup, the frontend should send:

- account fields
- direct profile fields
- `skills` as an array
- `courses` as an array

The backend returns:

- `authToken`
- `user`
- `profile`

## Notes For Database

The backend currently expects a schema that supports:

- `users`
- `profiles`
- `skills`
- `courses`
- `user_skills`
- `user_courses`

Right now I included [schema_draft.sql](./database/schema_draft.sql) as a draft of what the backend currently expects.

Important:

- I am treating `schema_draft.sql` as a backend-facing draft, not the final database schema
- the actual database design and final PostgreSQL schema should still be reviewed and finalized by Parthav and if the final schema changes, I would update the repositories/query layer to match it

Also, when I say the signup flow creates relationship rows for profile skills/courses, I mean that the backend is written to use those relationship tables if the final schema keeps that design. The relationship-table design itself is still something Parthav should confirm.

Current signup behavior in the backend:

1. create user
2. create profile
3. find or create each skill
4. insert relationship rows for profile skills
5. find or create each course
6. insert relationship rows for profile courses

This happens inside a transaction in [db.js](./src/config/db.js), so if one step fails, the whole signup operation can roll back.

## Folder Guide

### `src/config`

Shared backend configuration.

- [db.js](./src/config/db.js)
  PostgreSQL pool, query helper, transaction helper
- [env.js](./src/config/env.js)
  environment variable parsing

### `src/routes`

This folder defines API endpoints and maps them to controller functions.

Examples:

- [auth.routes.js](./src/routes/auth.routes.js)
- [index.js](./src/routes/index.js)

### `src/controllers`

This folder handles Express request/response logic.

Controllers are responsible for:

- receiving request data
- calling validators
- calling services
- returning JSON responses

Main one that is implemented:

- [auth.controller.js](./src/controllers/auth.controller.js)

### `src/validators`

This folder validates request payloads before business logic runs.

Examples:

- [auth.validator.js](./src/validators/auth.validator.js)
- [profile.validator.js](./src/validators/profile.validator.js)

### `src/services`

This folder contains business logic.

Services coordinate multiple repositories and decide how the backend flow works.

Examples:

- [account.service.js](./src/services/account.service.js)
  handles signup/signin flow
- [authentication.service.js](./src/services/authentication.service.js)
  handles password hashing, password verification, and token creation

### `src/repositories`

This folder contains database access logic.

Repositories are responsible for:

- running SQL
- keeping SQL out of controllers/services
- mapping rows into model objects or structured backend objects

Examples:

- [user.repository.js](./src/repositories/user.repository.js)
- [profile.repository.js](./src/repositories/profile.repository.js)
- [skill.repository.js](./src/repositories/skill.repository.js)
- [course.repository.js](./src/repositories/course.repository.js)
- [user-skill.repository.js](./src/repositories/user-skill.repository.js)
- [user-course.repository.js](./src/repositories/user-course.repository.js)

### `src/models`

This folder contains JavaScript representations of backend data shapes.

These are not the schema itself. They represent app-side objects like:

- user
- profile
- skill
- course

Examples:

- [user.model.js](./src/models/user.model.js)
- [profile.model.js](./src/models/profile.model.js)

### `src/middleware`

Reusable Express middleware lives here.

Examples:

- request logging
- error handling

### `src/utils`

Shared helper utilities that do not belong to one specific feature.

Example:

- [http-error.js](./src/utils/http-error.js)

### `database`

Database-related SQL files live here.

Current file:

- [schema_draft.sql](./database/schema_draft.sql)
