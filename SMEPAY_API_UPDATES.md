# SME Pay API Updates - November 2025

## ✅ Updated Configuration

### Base URL Changed
- **Old:** `https://extranet.smepay.in/api`
- **New:** `https://staging.smepay.in/api` (Test Environment)

### SMEPay Checkout Widget Integration

**Added Official SMEPay Widget:**
```html
<script src="https://typof.co/smepay/checkout-v2.js"></script>
```

**Widget Usage:**
```javascript
window.smepayCheckout({
  slug: "order_slug_from_api",
  onSuccess: (data) => {
    console.log("✅ Payment successful:", data);
    // Auto-verify payment
  },
  onFailure: () => {
    console.log("❌ Payment failed or closed.");
    // Show error message
  }
});
```

### API Endpoints Updated

#### 1. **Check Order Status**
**Old Endpoint:**
```
POST /api/wiz/external/order/status
```

**New Endpoint:**
```
POST /api/external/order/status
```

**Request Body:**
```json
{
  "client_id": "your_client_id",
  "order_id": "EXT-2025-0001",  // Optional
  "slug": "{{external_slug}}",   // Optional
  "ref_id": "{{external_ref_id}}" // Optional
}
```

**Response:**
```json
{
  "status": true,
  "order_id": "EXT-2025-0001",
  "payment_status": "PENDING|SUCCESS|FAILED|EXPIRED",
  "amount": 100.5,
  "provider": "phonepe",
  "created_at": 1736030500,
  "processed_at": 1736030822
}
```

#### 2. **Validate Order**
**Old Endpoint:**
```
POST /api/wiz/external/order/validate
```

**New Endpoint:**
```
POST /api/external/order/validate
```

**Request Body:**
```json
{
  "client_id": "your_client_id",
  "amount": 100.5,  // Numeric value
  "slug": "abc123"
}
```

#### 3. **Webhook Format**
**New Webhook Payload:**
```json
{
  "ref_id": "teastaindg1b0s1ssd2a",
  "transaction_id": "nwcy5tb",
  "status": "SUCCESS",
  "processed_at": "2025-01-01T12:00:00+05:30",
  "created_at": "2025-01-01T11:55:00+05:30",
  "amount": "100.00"
}
```

**Fields:**
- `ref_id` - Your external order ID (e.g., EXT-1762594234521)
- `transaction_id` - SME Pay's internal transaction ID (slug)
- `status` - Payment status (SUCCESS, PENDING, FAILED, EXPIRED)
- `amount` - Transaction amount
- `processed_at` - Processing timestamp
- `created_at` - Creation timestamp

## 🔧 Code Changes Made

### 1. `backend/utils/smePay.js`
✅ Updated API base URL to `https://staging.smepay.in/api`
✅ Updated `checkStatus()` endpoint to `/api/external/order/status`
✅ Updated `validateOrder()` endpoint to `/api/external/order/validate`
✅ Added `client_id` to status check request (required)
✅ Improved response mapping for backward compatibility

### 2. `backend/routes/recharge.js`
✅ Updated webhook handler to support new payload format
✅ Match recharges by `ref_id` (our external order_id)
✅ Match recharges by `transaction_id` (SME Pay's slug)
✅ Merge webhook data with existing provider_payload

### 3. `frontend/src/app.js`
✅ Use `payment_url` from SME Pay response instead of constructing URL
✅ Extract correct payment link: `https://link.smepay.in/@merchant/slug`
✅ **Integrated SMEPay Checkout Widget v2**
✅ Launch payment wizard with `window.smepayCheckout()`
✅ Auto-verify payment on success callback
✅ Handle payment failure with fallback options
✅ Fallback to URL opening if widget not loaded

### 4. `frontend/src/index.html`
✅ Added SMEPay checkout script: `https://typof.co/smepay/checkout-v2.js`
✅ Script loaded before app.js for availability

## 🚀 Testing the Updates

### 1. Update Environment Variables
Create/update `.env` in backend directory:
```env
SMEPAY_API_URL=https://staging.smepay.in/api
SMEPAY_CLIENT_ID=0d61e2d0403A78EF
SMEPAY_CLIENT_SECRET=your_secret_here
```

### 2. Restart Backend
```bash
cd backend
node server.js
```

### 3. Restart Frontend
```bash
cd frontend
node server.js
```

### 4. Test Recharge Flow
1. Login as student
2. Click "Recharge Now"
3. Select amount and proceed
4. **SMEPay checkout widget opens in modal** (no new window!)
5. Complete payment in the widget
6. Widget automatically calls `onSuccess` callback
7. Payment is auto-verified
8. Balance updates automatically
9. Modal closes and dashboard refreshes

### 5. Payment Widget Features
- ✅ Opens in-page modal (better UX)
- ✅ No popup blockers
- ✅ Auto-verification on success
- ✅ Handles failures gracefully
- ✅ QR code scanning support
- ✅ Multiple payment providers (PhonePe, GPay, Paytm, etc.)

## 📊 API Response Mapping

### Status Check Response
The `checkStatus()` function now maps the response properly:
```javascript
{
  status: true,                    // API status
  order_id: "LWV5942374568474",   // SME Pay order ID
  payment_status: "PENDING",       // Payment status
  amount: 100,                     // Amount
  provider: "phonepe",             // Payment provider
  created_at: 1736030500,         // Timestamp
  processed_at: null              // Processing time
}
```

### Webhook Processing
The webhook handler now correctly processes:
- `ref_id` → Matches our external order ID
- `transaction_id` → Matches order slug
- `status` → Updates payment status
- Automatic balance update on SUCCESS

## 🔍 Debugging

Check backend logs for detailed API calls:
- 🔍 = Request being made
- 📡 = Response received
- ✅ = Success
- ❌ = Error
- 💾 = Database update
- 💰 = Balance update

## ⚠️ Important Notes

1. **Client ID Required:** All status check requests must include `client_id`
2. **Endpoint Changed:** Status endpoint moved from `/wiz/external/` to `/external/`
3. **Webhook Format:** New minimal payload format with `ref_id` and `transaction_id`
4. **Payment URL:** Always use the `payment_url` from create order response
5. **Staging Environment:** Currently configured for test environment

## 🔄 Migration Checklist

- [x] Update API base URL to staging
- [x] Update status check endpoint
- [x] Update validate endpoint
- [x] Add client_id to status requests
- [x] Update webhook handler for new format
- [x] Use payment_url from API response
- [x] **Add SMEPay checkout widget script**
- [x] **Integrate widget with payment flow**
- [x] **Add onSuccess callback for auto-verification**
- [x] **Add onFailure callback for error handling**
- [x] **Add fallback for widget load failure**
- [x] Test complete recharge flow
- [x] Verify payment status updates
- [x] Confirm balance updates on success

---

**Last Updated:** November 8, 2025
**API Version:** External Order API v2
**Widget Version:** SMEPay Checkout v2
**Environment:** Staging (Test)
