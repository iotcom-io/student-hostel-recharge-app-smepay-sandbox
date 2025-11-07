# Student Hostel Recharge App - SMEPay Sandbox Demo

This project is a demo full-stack app with SMEPay sandbox integration (in-app widget).

## Quick start

1. Copy `backend/.env.example` to `backend/.env` and fill SMEPay credentials:
   - SMEPAY_CLIENT_ID
   - SMEPAY_CLIENT_SECRET
   - SMEPAY_API_URL (default: https://extranet.smepay.in/api)

2. Start MongoDB locally (default URI in .env.example).

3. Install and run backend:
   ```
   cd backend
   npm install
   node server.js
   ```
   Backend runs on port 4500 by default.

4. Install and run frontend (static):
   ```
   cd frontend
   npm install
   node server.js
   ```
   Frontend runs on port 3500 by default. Open http://localhost:3500

## How SMEPay flow works (sandbox)
- Backend authenticates with SMEPay (`/wiz/external/auth`) using client_id & client_secret.
- Backend creates orders (`/wiz/external/order/create`) and returns `order_slug` to frontend.
- Frontend opens SMEPay widget with `window.smepayCheckout({ slug })`.
- Widget handles payment in-app and calls `onSuccess`.
- Frontend calls backend `/api/recharge/verify` to confirm and credit balance.
- Backend also exposes `/api/recharge/webhook` for direct provider callbacks.

## Notes
- Admin default: username `admin` password `admin@123`.
- Student default password is their studentId unless you set a password when creating.
- This is a demo: add proper security, input validation, HTTPS, and signature verification for production.
- If SMEPay auth returns tokens in a different place, adjust `backend/utils/smePay.js` to extract token accordingly.
