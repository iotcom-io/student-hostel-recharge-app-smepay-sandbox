# Student Hostel Recharge App - SMEPay Integration

Full-stack application for hostel student recharge management with SMEPay payment gateway integration.

## 🚀 Quick Start

### Local Development

1. **Configure Backend**
   Copy `backend/.env.example` to `backend/.env` and fill SMEPay credentials:
   ```env
   PORT=4500
   MONGO_URI=mongodb://localhost:27017/hostelapp
   JWT_SECRET=your_secret_key
   SMEPAY_API_URL=https://staging.smepay.in/api
   SMEPAY_CLIENT_ID=your_client_id
   SMEPAY_CLIENT_SECRET=your_client_secret
   ```

2. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

3. **Install and Run Backend**
   ```bash
   cd backend
   npm install
   node server.js
   ```
   Backend runs on port 4500 by default.

4. **Install and Run Frontend**
   ```bash
   cd frontend
   npm install
   node build.js  # Build frontend
   node server.js # Serve frontend
   ```
   Frontend runs on port 3500. Open http://localhost:3500

### Production Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete production deployment guide to `recharge.iotcom.io`

## 🔧 Dynamic API Configuration

The frontend automatically detects its environment:

- **Local Development:** Uses `http://localhost:4500/api`
- **Production:** Uses same domain as frontend (e.g., `https://recharge.iotcom.io/api`)
- No hardcoded URLs needed!

```javascript
// Automatically configured in frontend/src/app.js
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:4500/api'  
    : `${window.location.protocol}//${window.location.hostname}/api`;
```

## 💳 How SMEPay Integration Works

1. **Authentication:** Backend authenticates with SMEPay using `client_id` & `client_secret`
2. **Create Order:** Backend calls `/api/wiz/external/order/create` and returns `order_slug`
3. **Payment Widget:** Frontend launches SMEPay widget with `window.smepayCheckout({ slug })`
4. **In-App Payment:** Widget handles payment in modal (no new window!)
5. **Success Callback:** Widget calls `onSuccess` when payment completes
6. **Auto-Verification:** Frontend automatically verifies payment status
7. **Balance Update:** Backend credits student balance on successful payment
8. **Webhook:** Backend receives webhook from SMEPay for payment confirmation

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Quick reference guide
- **[FRONTEND_GUIDE.md](FRONTEND_GUIDE.md)** - Complete frontend documentation
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[SMEPAY_API_UPDATES.md](SMEPAY_API_UPDATES.md)** - API changelog and updates

## 🔐 Default Credentials

- **Admin:** 
  - Username: `admin`
  - Password: `admin@123`

- **Student:** 
  - Student ID: Created by admin
  - Password: Set during student creation (or defaults to Student ID)

## ⚠️ Notes

- This uses SMEPay **staging environment** for testing
- For production, update `SMEPAY_API_URL` to production endpoint
- Change default admin password after first login
- Add proper security, input validation, and HTTPS for production
- Implement signature verification for webhook callbacks
- Use environment-specific configurations
