# BABA NANAK ACADEMY ONLINE

Full student lifecycle platform based on the academy blueprint.

## Frontend pages

- `index.html` — public academy website
- `portal.html` — student portal
- `admin.html` — admin dashboard
- `verify.html` — public certificate verification

## Automated workflow

1. Student registration and login
2. Course selection
3. Enrollment
4. Payment order / verification
5. Course access
6. Lesson progress tracking
7. Timed-style exam delivery
8. Automatic evaluation
9. Instant result + pass/fail
10. DMC result history
11. Automatic certificate number + grade
12. Public certificate verification
13. Admin statistics, students, enrollments and results

## Backend

Node.js + Express + SQLite + JWT + bcrypt. See `backend/README.md`.

## Live deployment architecture

GitHub Pages → static frontend

Node.js host → API + database

Payment provider → server-side payment verification → automatic enrollment activation

Before accepting real payments, configure the payment provider credentials and its server-side signature/webhook verification. Never put secret keys in frontend files.
