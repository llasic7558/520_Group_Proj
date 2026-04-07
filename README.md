## Five College Connect

### Overview

This project addresses the difficulty students may face when trying to find work or opportunities within the five colleges. Existing platforms target large job boards or general channels, making it very hard for students to stand out or be discovered for opportunities that match their specific skills. Specifically, the UMASS Job Board lacks any type of functionality to apply to jobs or give the employer an idea of who you are. Applications can get lost among many others, and students have to repeatedly fill out forms or send generic resumes for every single job. Our system aims to solve this by creating a centralized platform for students where they can build very detailed profiles highlighting courses, skills, and projects. This allows them to just share their profile with other students or organizations within the school.

The primary users of the platform are students within the Five College community who are seeking tutoring, technical support, project collaborators, startups, or small skill-based jobs. Other stakeholders here would be students who are offering tutoring or technical help. The main objective of the system is to make it easier for students to connect based on their skills, coursework, and interests while reducing the friction you find in current-day job boards and websites. By verifying users through university emails and focusing on profiles, the platform helps build a trusted network that supports collaboration, academic success, and peer-driven learning across the Five Colleges.

### Team Members
- Devin Bowler
- Parthav Elangovan
- Luka Lasic
- Stanley Yang 

### Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend | React, JavaScript | Component-based UI; shared language with the backend. |
| Backend | Express.js, Node.js | API in `five_college_connect/server`. |
| Database | PostgreSQL | Structured data, joins, and referential integrity for profiles and related entities. |
| Ops | Docker, Redis, AWS (target) | Containers for deployment; Redis for queues/async work; AWS for hosted production. |

The frontend app is a **Vite + React** project under **`five_college_connect/client`** using **JavaScript** (`.jsx`).

### Getting Started

#### Prerequisites
- [Node.js](https://nodejs.org/) LTS (includes `npm`) for the React app and the server

#### Installation (client)
```bash
git clone <repo-url>
cd 520_Group_Proj
cd five_college_connect/client
npm install
```

#### Running the Project (frontend dev server)
```bash
cd five_college_connect/client
npm run dev
```
Then open the URL printed in the terminal (typically `http://localhost:5173`).

#### Production build (frontend)
```bash
cd five_college_connect/client
npm run build
npm run preview   # optional: serve the built files locally
```

#### Lint (frontend)
```bash
cd five_college_connect/client
npm run lint
```

#### Running Tests
```bash
# (tests not yet configured for client; see five_college_connect/server/tests)
```

### Project Structure
```
520_Group_Proj/
├── five_college_connect/
│   ├── client/            # React (Vite) app — JavaScript, component-based UI
│   │   ├── src/
│   │   ├── public/
│   │   ├── index.html
│   │   └── package.json
│   └── server/            # Express API, models, database
├── tests/
├── docs/
├── config/
├── scripts/
├── .gitignore
└── README.md
```

### Contributing
1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Commit your changes (`git commit -m 'Add some feature'`)
3. Push to the branch (`git push origin feature/your-feature`)
4. Open a Pull Request
