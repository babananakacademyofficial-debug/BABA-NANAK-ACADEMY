# BABA NANAK ACADEMY ONLINE

Clean rebuild of the Baba Nanak Academy student website.

## Live frontend

- `index.html` — academy home
- `courses.html` — live course catalogue
- `admission.html` — student registration
- `portal.html` — student portal
- `admin.html` — admin panel
- `payment.html` — payment/enrollment test step
- `verify.html` — certificate verification
- `certificate.html` — certificate view/print

## Main flow

Student Registration → Student ID → Course Selection → Payment/Verification → Enrollment → Results → Certificate

Admin flow:

Admin Login → Students → Payments → Fee Verify → Enrollment → Subject Result → Certificates

## Backend

The existing Google Apps Script endpoint is intentionally not changed by this frontend rebuild. Frontend requests use the deployed academy endpoint already configured in the pages.

## Payment

Razorpay secrets are not stored in GitHub Pages files. The public frontend only calls the existing server-side payment endpoints.

## Deployment

GitHub Pages serves the static frontend from `main`.
