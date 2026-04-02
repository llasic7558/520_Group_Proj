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

## Project Structure

```text
server/
├── src/                          # Main backend source code
│   ├── app.js                    # Creates the Express app and middleware setup
│   ├── server.js                 # Starts the server
│   ├── config/                   # Environment and database configuration
│   ├── constants/                # Shared constant values
│   ├── controllers/              # Request/response handlers
│   ├── middleware/               # Reusable Express middleware
│   ├── models/                   # Backend data models
│   ├── repositories/             # SQL/database access layer
│   ├── routes/                   # API route definitions
│   ├── services/                 # Business logic layer
│   ├── utils/                    # Shared helper utilities
│   └── validators/               # Request payload validation
├── tests/                        # Test-related files
├── database/                     # Draft SQL/database files
├── .env.example                  # Example environment variables
├── package.json                  # Backend package config and scripts
└── README.md                     # This file
```

### What the main folders are for

- [src/config](./src/config)
  Database connection and environment setup
- [src/routes](./src/routes)
  Defines API endpoints and maps them to controllers
- [src/controllers](./src/controllers)
  Handles incoming requests and outgoing responses
- [src/validators](./src/validators)
  Validates request payloads before business logic runs
- [src/services](./src/services)
  Contains the main backend business logic
- [src/repositories](./src/repositories)
  Handles SQL queries and database reads/writes
- [src/models](./src/models)
  Represents backend data objects
- [src/middleware](./src/middleware)
  Shared Express middleware like logging and error handling
- [src/utils](./src/utils)
  Small helper utilities used in multiple places
- [database](./database)
  SQL drafts and database-related files
