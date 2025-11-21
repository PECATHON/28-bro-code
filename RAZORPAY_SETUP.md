# Razorpay Payment Integration Setup

## ✅ Completed Integration

Razorpay payment integration has been successfully integrated into the application.

## 📋 Setup Steps

### 1. Database Setup

Run the SQL migration to create the `orders` and `transactions` tables:

```bash
# In Supabase SQL Editor, run:
server/migrations/create_orders_transactions.sql
```

This creates:
- **orders** table: Stores order information with status tracking
- **transactions** table: Stores detailed payment information for admin records

### 2. Environment Variables

The Razorpay keys are currently hardcoded in `server/routes/payment.js` (test mode):
- **Key ID**: `rzp_test_RiAF98in79f7cJ`
- **Key Secret**: `9kUB51zX3H9uhcD9XjuhXuvM`

**For production**, move these to environment variables:
```env
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
```

### 3. Dependencies Installed

- **Backend**: `razorpay` package
- **Frontend**: `react-native-razorpay` package

## 🔄 Payment Flow

1. **User clicks "Pay"** in CheckoutScreen
2. **Backend creates Razorpay order** (`/api/payment/create-order`)
3. **Razorpay checkout opens** with order details
4. **User completes payment** via Razorpay
5. **Backend verifies payment** (`/api/payment/verify`)
   - Verifies signature
   - Creates order record with status "confirmed"
   - Creates transaction record with full payment details
6. **Cart is cleared** and user is redirected to Orders screen

## 📊 Database Schema

### Orders Table
- `id`: Razorpay order ID (primary key)
- `user_id`: User who placed the order
- `vendor_id`: Vendor receiving the order
- `items`: JSON array of ordered items
- `total_amount`: Total order amount
- `status`: pending, confirmed, cancelled, completed
- `payment_id`: Razorpay payment ID
- `payment_method`: Payment method used
- `created_at`, `updated_at`: Timestamps

### Transactions Table
- `id`: UUID (primary key)
- `order_id`: Reference to orders table
- `payment_id`: Razorpay payment ID (unique)
- `user_id`, `vendor_id`: References
- `amount`, `currency`: Payment amount details
- `payment_status`: Payment status from Razorpay
- `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`: Razorpay identifiers
- `payment_details`: JSONB with additional Razorpay payment information
- `created_at`: Timestamp

## 🔐 Security Features

- **Signature Verification**: All payments are verified using HMAC SHA256 signature
- **RLS Policies**: Row Level Security enabled for orders and transactions
- **Service Role**: Admin operations use service role client to bypass RLS

## 📱 Frontend Integration

The `CheckoutScreen` component:
- Displays order summary with items
- Calculates subtotal, GST (18%), and delivery fee
- Opens Razorpay checkout on payment
- Handles payment success/failure
- Clears cart and navigates to Orders on success

## 🧪 Testing

### Test Cards (Razorpay Test Mode)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test Flow
1. Add items to cart
2. Go to checkout
3. Click "Pay"
4. Use test card: 4111 1111 1111 1111
5. Complete payment
6. Verify order appears in Orders screen
7. Check database for order and transaction records

## 📝 API Endpoints

### POST `/api/payment/create-order`
Creates a Razorpay order.

**Request:**
```json
{
  "amount": 500,
  "currency": "INR",
  "receipt": "order_123",
  "notes": {
    "userId": "user-uuid",
    "vendorId": "vendor-uuid"
  }
}
```

**Response:**
```json
{
  "id": "order_xxx",
  "amount": 50000,
  "currency": "INR",
  "receipt": "order_123",
  "status": "created"
}
```

### POST `/api/payment/verify`
Verifies payment and creates order/transaction records.

**Request:**
```json
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "signature_hash",
  "userId": "user-uuid",
  "vendorId": "vendor-uuid",
  "items": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and order confirmed",
  "order": {...},
  "transaction": {...}
}
```

## 🚀 Next Steps

1. Run the SQL migration in Supabase
2. Test the payment flow with test cards
3. For production:
   - Update Razorpay keys to live keys
   - Move keys to environment variables
   - Test with real payments
   - Set up webhook for payment status updates (optional)

## 📌 Notes

- All amounts are in **INR** (Indian Rupees)
- Amounts are converted to **paise** (smallest currency unit) for Razorpay
- GST is calculated at 18%
- Delivery fee is fixed at ₹20
- Orders are automatically set to "confirmed" status on successful payment

