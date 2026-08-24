# Baba Nanak Academy — Clean Setup

## Apps Script Script Properties
Add:
- `RAZORPAY_KEY_ID` = your Razorpay test/live key id
- `RAZORPAY_KEY_SECRET` = your Razorpay secret
- `ADMIN_PASSWORD` = your chosen admin password (optional; default is `BNAADMIN2026`)

## Deploy
1. Open Apps Script.
2. Replace Code.gs with this branch's Code.gs.
3. Run `setupSheets()` once.
4. Deploy as Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. Use the resulting `/exec` URL in the frontend if it changes.

## Website
- `index.html` — main page
- `admission.html` — student registration
- `portal.html` — student login, courses, Razorpay payment, dashboard
- `admin.html` — admin login and sheet dashboard

## Important
Existing Google Sheet records are not deleted by `setupSheets()`; it only creates missing sheets and headers.
