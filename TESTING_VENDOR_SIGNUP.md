# Testing Vendor Signup

## Method 1: Test API Endpoint Directly (Recommended First)

### Using cURL:
```bash
curl -X POST http://172.31.68.164:3000/api/auth/vendor-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testvendor@example.com",
    "password": "testpassword123",
    "full_name": "John Vendor",
    "shop_name": "Test Shop"
  }'
```

### Using Postman/Thunder Client:
1. **Method**: POST
2. **URL**: `http://172.31.68.164:3000/api/auth/vendor-signup`
3. **Headers**: 
   - `Content-Type: application/json`
4. **Body** (JSON):
```json
{
  "email": "testvendor@example.com",
  "password": "testpassword123",
  "full_name": "John Vendor",
  "shop_name": "Test Shop"
}
```

### Expected Success Response (201):
```json
{
  "message": "Vendor registered successfully",
  "vendor_id": "uuid-here",
  "profile": {
    "id": "uuid-here",
    "full_name": "John Vendor",
    "role": "vendor",
    "created_at": "2024-..."
  }
}
```

### Expected Error Responses:
- **400**: Missing fields or validation error
- **500**: Database error (check server logs)

---

## Method 2: Test from Frontend App

1. **Open the app** and navigate to Vendor Registration screen
2. **Fill in the form**:
   - Owner Name: "Test Vendor"
   - Shop Name: "Test Shop"
   - Email: "vendor@test.com" (use a new email each time)
   - Password: "password123"
3. **Click Register**
4. **Check the console logs** for:
   - `VendorRegister - Profile role: vendor Final role: vendor`
   - `AppNavigator - User role: vendor Routing to: VendorApp`
5. **Expected behavior**:
   - Loading indicator shows
   - Automatically navigates to Vendor Home (Dashboard)
   - Shows vendor dashboard with stats

---

## Method 3: Check Server Logs

When you make a request, you should see these logs in your server console:

```
📥 Vendor Signup Request: { email: '...', password: '...', full_name: '...', shop_name: '...' }
🟢 Auth user created: <user-id>
🟢 Vendor inserted into table: <user-id>
🟢 Profile created with role='vendor': <user-id>
```

If you see errors:
- `❌ createUser error:` - Auth user creation failed
- `❌ Vendor insert error:` - Vendors table insert failed
- `❌ Profile insert error:` - Profile table insert failed

---

## Method 4: Verify Database Entries

### Check Supabase Dashboard:

1. **Auth Users Table**:
   - Go to Authentication → Users
   - Find the new user by email
   - Verify user was created

2. **Vendors Table**:
   - Go to Table Editor → `vendors`
   - Find row with matching `id` (user.id)
   - Verify: `owner_name`, `shop_name`, `email`, `status: "approved"`

3. **Profiles Table**:
   - Go to Table Editor → `profiles`
   - Find row with matching `id` (user.id)
   - **IMPORTANT**: Verify `role: "vendor"` is set correctly

---

## Method 5: Test Login After Registration

After successful registration, test login:

1. **Use the same credentials** to log in
2. **Check console logs**:
   - Should see: `Login - Profile role: vendor Final role: vendor`
   - Should see: `AppNavigator - Routing to: VendorApp`
3. **Expected**: Should land on Vendor Home screen

---

## Troubleshooting

### Issue: "No response from server"
- ✅ Check server is running: `http://172.31.68.164:3000/health`
- ✅ Check server logs for errors
- ✅ Verify `.env` file has correct Supabase credentials

### Issue: "Profile role not set"
- ✅ Check `profiles` table in Supabase
- ✅ Verify `role` column has value `"vendor"`
- ✅ Check server logs for profile creation errors

### Issue: "Not routing to Vendor Home"
- ✅ Check frontend console for role logs
- ✅ Verify `user.role === 'vendor'` in AppNavigator
- ✅ Check VendorNavigator has `initialRouteName="VendorHome"`

### Issue: "CORS error"
- ✅ Check server CORS whitelist includes your origin
- ✅ Verify `BACKEND_BASE` URL matches server IP

---

## Quick Test Checklist

- [ ] Server is running and accessible
- [ ] API endpoint responds (test with curl/Postman)
- [ ] Auth user is created in Supabase
- [ ] Vendor entry is created in `vendors` table
- [ ] Profile entry is created with `role='vendor'`
- [ ] Frontend registration form works
- [ ] Auto-login after registration works
- [ ] Navigation to Vendor Home works
- [ ] Manual login with vendor credentials works

