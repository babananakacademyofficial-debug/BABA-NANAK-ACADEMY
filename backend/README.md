# Baba Nanak Academy Online — Automation Backend

This backend powers the student lifecycle: registration → course → payment → study → exam → result → DMC → certificate.

## Run locally

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Default API: `http://localhost:3000`

## Main APIs

- `POST /api/auth/register` — student registration
- `POST /api/auth/login` — student login
- `GET /api/courses` — active courses
- `POST /api/enrollments` — create enrollment
- `POST /api/payments/create-order` — payment order record
- `POST /api/payments/verify` — activate course after payment verification
- `GET /api/student/dashboard` — student dashboard
- `GET /api/student/courses/:courseId/content` — lessons + exam
- `POST /api/student/progress` — mark lesson complete
- `GET /api/student/exams/:examId` — exam questions
- `POST /api/student/exams/:examId/submit` — auto evaluation + result + certificate generation
- `GET /api/student/results` — result history
- `GET /api/student/dmc` — DMC data
- `GET /api/verify/:certificateNo` — public certificate verification
- `POST /api/admin/login` — admin login
- `GET /api/admin/stats` — dashboard statistics
- `GET /api/admin/students` — student list
- `GET /api/admin/enrollments` — enrollment list
- `GET /api/admin/results` — result list

## Important production setup

GitHub Pages hosts the static frontend only. Deploy this `backend/` service on a Node.js host and put its URL into the Student Portal's **API Settings**. Set a strong `JWT_SECRET`, a real admin password, the exact GitHub Pages origin, and real payment-provider credentials before accepting live money.

The current payment flow is intentionally **demo-safe** when Razorpay credentials are absent. It must not be treated as a live payment gateway until the provider's server-side order creation, signature verification and webhook handling are configured with real credentials.
