# Baba Nanak Academy Backend

Node.js + Express backend foundation for the academy website.

## Run locally

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The API runs on `http://localhost:3000` by default.

## Endpoints

- `GET /api/health` — API health check
- `GET /api/courses` — active courses
- `POST /api/students` — create student registration
- `GET /api/students/:id` — fetch one student

Example registration JSON:

```json
{
  "name": "Student Name",
  "contact": "student@example.com",
  "course": "Course Name"
}
```

## Important

GitHub Pages can host the HTML/CSS/JavaScript front end, but it cannot execute Node.js/PHP server code. The `backend` folder therefore needs a server host (for example Render, Railway, or another Node.js host) before live registration, login, database, payments and admin APIs can run.

Do not commit real payment keys, database passwords, JWT secrets, or other credentials. Put them in the server host's environment variables.
