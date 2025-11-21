# Payment Debugging Guide

## Common Issues and Solutions

### 1. "Failed to create payment order" Error

**Possible Causes:**
- Server not running
- Network timeout
- Razorpay API error
- Invalid Razorpay credentials
- CORS issue

**Debugging Steps:**

1. **Check if server is running:**
   ```bash
   curl http://172.31.68.164:3000/health
   ```
   Should return: `{"status":"ok"}`

2. **Test payment route:**
   ```bash
   curl http://172.31.68.164:3000/api/payment/test
   ```
   Should return: `{"status":"ok","message":"Payment route is accessible","razorpay_initialized":true}`

3. **Check server logs:**
   - Look for "📥 Creating Razorpay order" log
   - Look for "✅ Razorpay order created" or "❌ Razorpay order creation error"
   - Check for detailed error information

4. **Test order creation manually:**
   ```bash
   curl -X POST http://172.31.68.164:3000/api/payment/create-order \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 100,
       "currency": "INR",
       "receipt": "test_receipt_123"
     }'
   ```

5. **Check network connectivity:**
   - Ensure device/emulator can reach server IP
   - For iOS Simulator: Use `localhost:3000` or `127.0.0.1:3000`
   - For Android Emulator: Use `10.0.2.2:3000`
   - For real device: Use your computer's LAN IP (e.g., `172.31.68.164:3000`)

### 2. Network Timeout Issues

**Symptoms:**
- "Network request timed out" error
- Request takes too long

**Solutions:**
- Check server is running and accessible
- Verify BACKEND_BASE URL is correct
- Check firewall/network settings
- Try accessing server from browser: `http://172.31.68.164:3000/health`

### 3. Razorpay API Errors

**Common Razorpay Errors:**
- `BAD_REQUEST_ERROR`: Invalid request parameters
- `GATEWAY_ERROR`: Razorpay service issue
- `SERVER_ERROR`: Razorpay server error

**Check:**
- Razorpay keys are correct (test mode)
- Amount is valid (minimum ₹1 = 100 paise)
- Currency is supported (INR)

### 4. CORS Issues

**Symptoms:**
- Request blocked in browser console
- CORS error messages

**Solution:**
- Check server CORS whitelist includes your origin
- For Expo Go, CORS should allow requests without origin header

## Testing Checklist

- [ ] Server is running (`/health` endpoint works)
- [ ] Payment route is accessible (`/api/payment/test` works)
- [ ] Can create order manually via curl
- [ ] Frontend can reach backend (check network tab)
- [ ] Razorpay keys are correct
- [ ] Amount is valid (>= 1)
- [ ] Network connectivity is working

## Server Logs to Check

When creating an order, you should see:
```
📥 Creating Razorpay order with options: { amount: 10000, currency: 'INR', receipt: '...' }
✅ Razorpay order created: order_xxx
```

If there's an error:
```
❌ Razorpay order creation error: ...
Error details: { message: '...', description: '...', ... }
```

## Quick Test Commands

```bash
# Test server health
curl http://172.31.68.164:3000/health

# Test payment route
curl http://172.31.68.164:3000/api/payment/test

# Test order creation
curl -X POST http://172.31.68.164:3000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"INR","receipt":"test123"}'
```

