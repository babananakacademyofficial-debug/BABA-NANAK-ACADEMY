# Google Sheets integration

## 1. Create the Google Sheet
Create one Google Sheet for Baba Nanak Academy. Copy its Sheet ID from the URL.

## 2. Create Apps Script
In the Sheet open **Extensions → Apps Script**. Replace the editor contents with `Code.gs` from this folder.

## 3. Add Script Properties
Apps Script → Project Settings → Script Properties:

- `SHEET_ID` = your Google Sheet ID
- `API_SECRET` = a long random secret used by the academy backend/frontend integration

## 4. Prepare tabs
Run `setupSheets()` once and authorize it. It creates:

- Students
- Enrollments
- Payments
- Results
- Certificates

## 5. Deploy
Deploy → New deployment → Web app.

Execute as: **Me**

Who has access: **Anyone**

Copy the Web App URL. This URL will be used by the academy system to mirror registration, enrollment, payment, result and certificate events into the Sheet.

## Data flow

`Student Registration → Students`

`Course + Subjects → Enrollments`

`Razorpay Payment → Payments`

`Online Exam → Results`

`PASS → Certificates`

The local application database remains the source of truth for authentication and payment security; Google Sheets is the academy's live reporting/record mirror.
