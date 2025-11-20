# Testing Menu API

## Prerequisites
- Server running on `http://172.31.68.164:3000`
- A vendor user ID (get this after vendor registration)
- Menu items table exists in Supabase

---

## Test 1: Get Vendor Menu (GET)

```bash
# Replace VENDOR_ID with actual vendor ID from your database
curl -X GET http://172.31.68.164:3000/api/menu/VENDOR_ID
```

**Expected Response:**
```json
[]
```
(Empty array if no items, or array of menu items)

---

## Test 2: Create Menu Item (POST)

```bash
# Replace VENDOR_ID with actual vendor ID
curl -X POST http://172.31.68.164:3000/api/menu/VENDOR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger",
    "description": "Delicious beef burger",
    "price": 120,
    "category": "Fast Food",
    "is_available": true
  }'
```

**Expected Response (201):**
```json
{
  "id": "uuid-here",
  "vendor_id": "VENDOR_ID",
  "name": "Burger",
  "description": "Delicious beef burger",
  "price": 120,
  "category": "Fast Food",
  "is_available": true,
  "created_at": "2024-..."
}
```

**Save the `id` from response for next tests!**

---

## Test 3: Get Menu Again (should show new item)

```bash
curl -X GET http://172.31.68.164:3000/api/menu/VENDOR_ID
```

**Expected:** Array with the burger item

---

## Test 4: Update Menu Item (PUT)

```bash
# Replace VENDOR_ID and ITEM_ID with actual IDs
curl -X PUT http://172.31.68.164:3000/api/menu/VENDOR_ID/ITEM_ID \
  -H "Content-Type: application/json" \
  -d '{
    "price": 150,
    "description": "Updated description"
  }'
```

**Expected Response:**
```json
{
  "id": "ITEM_ID",
  "price": 150,
  "description": "Updated description",
  ...
}
```

---

## Test 5: Delete Menu Item (DELETE)

```bash
# Replace VENDOR_ID and ITEM_ID with actual IDs
curl -X DELETE http://172.31.68.164:3000/api/menu/VENDOR_ID/ITEM_ID
```

**Expected Response:**
```json
{
  "message": "Deleted"
}
```

---

## Test 6: Import Menu from CSV (POST)

```bash
# Replace VENDOR_ID with actual vendor ID
curl -X POST http://172.31.68.164:3000/api/menu/VENDOR_ID/import \
  -H "Content-Type: application/json" \
  -d '{
    "csvText": "name,description,price,category,is_available\nPizza,Cheese pizza,200,Italian,true\nPasta,Creamy pasta,180,Italian,true\nSalad,Fresh salad,150,Healthy,true"
  }'
```

**Expected Response:**
```json
{
  "inserted": 3,
  "data": [...]
}
```

---

## Test 7: Export Menu (GET)

```bash
curl -X GET http://172.31.68.164:3000/api/menu/export/VENDOR_ID
```

**Expected:** JSON array of all menu items

---

## Quick Test Script

Save this as `test-menu.sh` and run: `chmod +x test-menu.sh && ./test-menu.sh`

```bash
#!/bin/bash

BASE_URL="http://172.31.68.164:3000"
VENDOR_ID="YOUR_VENDOR_ID_HERE"  # Replace with actual vendor ID

echo "🧪 Testing Menu API..."
echo ""

echo "1️⃣  GET Menu (should be empty initially)"
curl -s -X GET "$BASE_URL/api/menu/$VENDOR_ID" | jq .
echo ""

echo "2️⃣  POST Create Item"
ITEM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/menu/$VENDOR_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Burger",
    "description": "Test item",
    "price": 100,
    "category": "Test"
  }')
echo "$ITEM_RESPONSE" | jq .
ITEM_ID=$(echo "$ITEM_RESPONSE" | jq -r '.id')
echo "Created item ID: $ITEM_ID"
echo ""

echo "3️⃣  GET Menu (should show new item)"
curl -s -X GET "$BASE_URL/api/menu/$VENDOR_ID" | jq .
echo ""

if [ "$ITEM_ID" != "null" ] && [ -n "$ITEM_ID" ]; then
  echo "4️⃣  PUT Update Item"
  curl -s -X PUT "$BASE_URL/api/menu/$VENDOR_ID/$ITEM_ID" \
    -H "Content-Type: application/json" \
    -d '{"price": 150}' | jq .
  echo ""

  echo "5️⃣  DELETE Item"
  curl -s -X DELETE "$BASE_URL/api/menu/$VENDOR_ID/$ITEM_ID" | jq .
  echo ""
fi

echo "✅ Tests complete!"
```

---

## Testing from Frontend (VendorMenuEditor)

1. **Login as vendor** → Should navigate to Vendor Home
2. **Go to Menu tab** → Opens VendorMenuEditor
3. **Add an item**:
   - Enter: Name: "Pizza", Price: "250", Category: "Italian"
   - Click "Add"
   - Should see item appear in list
4. **Delete an item**:
   - Click "Delete" on any item
   - Confirm deletion
   - Item should disappear
5. **Refresh**:
   - Click "Refresh" button
   - Should reload menu from server

---

## Common Issues & Solutions

### Issue: "Failed to fetch menu"
- ✅ Check server is running: `curl http://172.31.68.164:3000/health`
- ✅ Verify vendor ID is correct
- ✅ Check Supabase `menu_items` table exists

### Issue: "Failed to create item"
- ✅ Check `name` and `price` are provided
- ✅ Verify `price` is a number
- ✅ Check server logs for database errors

### Issue: "Route not found"
- ✅ Verify route order in menu.js (specific routes before generic)
- ✅ Check server.js has `app.use("/api/menu", menuRoutes)`

### Issue: "CORS error"
- ✅ Check server CORS whitelist includes your origin
- ✅ Verify `BACKEND_BASE` URL in frontend matches server

---

## Get Vendor ID

After vendor registration, you can get the vendor ID from:
1. **Supabase Dashboard** → Authentication → Users → Copy user ID
2. **Or from registration response**: `vendor_id` field
3. **Or from frontend**: `user.id` in AuthContext after login

---

## Sample Test Data

```json
{
  "name": "Margherita Pizza",
  "description": "Classic Italian pizza with tomato and mozzarella",
  "price": 299,
  "category": "Italian",
  "is_available": true
}
```

```json
{
  "name": "Chicken Burger",
  "description": "Crispy chicken burger with special sauce",
  "price": 180,
  "category": "Fast Food",
  "is_available": true
}
```

