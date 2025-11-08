# Student Hostel Recharge Application - Frontend Guide

## 🎉 Complete Login & Dashboard System with SME Pay Integration

The frontend has been completely built with login functionality for both Admin and Student panels with full SME Pay payment gateway integration.

---

## 🚀 Getting Started

### 1. Start Backend Server (Port 4500)
```bash
cd backend
node server.js
```
**Note:** Backend runs on port 4500 (default)

### 2. Start Frontend Server (Port 3500)
```bash
cd frontend
node server.js
```

### 3. Access the Application
Open your browser: **http://localhost:3500**

---

## 🔐 Default Login Credentials

### Admin Login
- **Username:** `admin`
- **Password:** `admin@123`

### Student Login
- First add a student through admin panel
- **Student ID:** As set by admin (e.g., `STU001`)
- **Password:** As set by admin during student creation
- **Default:** If no password set, use the Student ID as password

---

## 📋 Features Implemented

### 🎯 Login Page
- ✅ Toggle between Admin and Student login
- ✅ Form validation
- ✅ JWT token-based authentication
- ✅ Session persistence with localStorage

### 👨‍💼 Admin Dashboard
- ✅ **Add New Students**
  - Student ID, Name, Room Number
  - Set password for student login
  - Add multiple parent/guardian contacts (allowed calling numbers)
- ✅ **View All Students**
  - See all registered students
  - View balance, room info, parent count
- ✅ **Logout functionality**

### 👨‍🎓 Student Dashboard
- ✅ **Account Balance Display**
  - Real-time balance in ₹ (Rupees)
  - Prominent display in gradient card
- ✅ **Student Information**
  - Student ID, Name, Room Number
- ✅ **Parent Contact Numbers**
  - View all allowed contact numbers for calling
  - Parent/Guardian names and phone numbers
- ✅ **Recharge History**
  - Date, Amount, Status, Transaction ID
  - Color-coded status badges (Success/Pending/Failed)
- ✅ **Call History**
  - Date & Time, To Number, Duration, Cost
  - Formatted duration (minutes and seconds)
- ✅ **Recharge Functionality**
  - Select amount (₹100, ₹200, ₹500, ₹1,000, ₹2,000, ₹5,000)
  - Integrates with SME Pay payment gateway
  - Opens payment widget in new window
  - Payment verification system
  - Auto-updates balance after successful payment

---

## 💳 SME Pay Integration Flow

### How Recharge Works:

1. **Student clicks "Recharge Now"**
   - Modal opens with amount selection

2. **Student selects amount and clicks "Proceed to Payment"**
   - Frontend calls backend `/api/recharge/create`
   - Backend creates order with SME Pay API
   - Returns order slug and transaction ID

3. **Payment Widget Opens**
   - SME Pay payment widget opens in new window
   - Student completes payment on SME Pay portal

4. **Payment Verification**
   - Student clicks "Verify Payment"
   - Frontend calls backend `/api/recharge/verify`
   - Backend checks status with SME Pay
   - If successful, balance is updated automatically

5. **Balance Updated**
   - Dashboard refreshes with new balance
   - Recharge appears in history

### API Endpoints Used:
- `POST /api/recharge/create` - Create payment order
- `POST /api/recharge/verify` - Verify payment status
- `POST /api/recharge/webhook` - Webhook for SME Pay callbacks (automatic)

---

## 🔧 Configuration

### Backend API URL
Located in `frontend/src/app.js`:
```javascript
const API_BASE = 'http://localhost:4500/api';
```

### SME Pay Widget URL
```javascript
const SMEPAY_WIDGET_URL = 'https://extranet.smepay.in/payment/widget';
```

### Environment Variables (Backend)
Create `.env` file in backend directory:
```
PORT=4500
MONGO_URI=mongodb://localhost:27017/hostelapp
JWT_SECRET=your_secret_key_here
SMEPAY_API_URL=https://staging.smepay.in/api
SMEPAY_CLIENT_ID=your_client_id
SMEPAY_CLIENT_SECRET=your_client_secret
```

**Note:** Using staging environment for testing. For production, use:
```
SMEPAY_API_URL=https://extranet.smepay.in/api
```

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── index.html       # Main HTML with all screens
│   ├── app.js          # JavaScript logic for all functionality
│   └── styles.css      # Complete responsive styling
├── dist/               # Built files (served by server.js)
├── build.js           # Build script to copy src to dist
├── server.js          # Express server for frontend
└── package.json

backend/
├── models/
│   ├── AdminUser.js    # Admin model with default credentials
│   ├── Student.js      # Student model with parents
│   ├── Recharge.js     # Recharge transactions
│   └── CallHistory.js  # Call records
├── routes/
│   ├── auth.js         # Login endpoints
│   ├── admin.js        # Admin operations
│   ├── students.js     # Student data
│   └── recharge.js     # SME Pay integration
├── utils/
│   └── smePay.js       # SME Pay API helper
└── server.js
```

---

## 🎨 Design Features

- **Modern Gradient UI** - Purple gradient theme
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Modal System** - Clean recharge modal with payment status
- **Color-coded Status** - Visual indicators for payment status
- **Card-based Layout** - Clean sectioned information display
- **Smooth Animations** - Hover effects and transitions
- **Accessible Forms** - Proper labels and validation

---

## 🔄 Workflow Examples

### Admin Workflow:
1. Login with admin credentials
2. Add new student with details
3. Add parent contact numbers (these are allowed for calling)
4. View all students and their balances

### Student Workflow:
1. Login with Student ID and password
2. View current balance
3. Check parent contact numbers
4. View recharge and call history
5. Click "Recharge Now" to add balance
6. Complete payment on SME Pay
7. Verify payment to update balance

---

## 🛠️ Development Notes

### Building Frontend:
```bash
cd frontend
node build.js
```
This copies all files from `src/` to `dist/` directory.

### API Authentication:
All authenticated requests include JWT token:
```javascript
headers: {
    'Authorization': `Bearer ${token}`
}
```

### Payment Amount Format:
- Frontend uses **cents** (₹100 = 10000 cents)
- Ensures precise decimal handling
- Backend converts cents to rupees for SME Pay

---

## 🚨 Troubleshooting

### Backend connection error
- Ensure backend is running on port 4500
- Check MongoDB is running
- Verify CORS is enabled

### SME Pay integration issues
- Check SMEPAY credentials in backend `.env`
- Verify sandbox/production API URL
- Check network tab for API responses

### Login issues
- Clear browser localStorage and try again
- Check browser console for errors
- Verify backend is returning JWT token

### Payment verification
- Payment slug must be correct
- Allow time for SME Pay to process
- Check backend logs for detailed error messages

---

## 📞 Support

For any issues:
1. Check browser console for errors
2. Check backend terminal for API logs
3. Verify MongoDB connection
4. Check SME Pay credentials and API responses

---

## ✅ Testing Checklist

- [ ] Admin can login
- [ ] Admin can add students
- [ ] Admin can add parent numbers
- [ ] Admin can view all students
- [ ] Student can login
- [ ] Student sees correct balance
- [ ] Student sees parent numbers
- [ ] Student sees recharge history
- [ ] Student sees call history
- [ ] Recharge modal opens
- [ ] Payment order creates successfully
- [ ] SME Pay widget opens
- [ ] Payment verification works
- [ ] Balance updates after payment
- [ ] Logout works for both roles

---

**🎉 Your complete hostel recharge application with SME Pay is ready to use!**
