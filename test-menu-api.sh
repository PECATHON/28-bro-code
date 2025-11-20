#!/bin/bash

# Menu API Test Script
# Usage: ./test-menu-api.sh [VENDOR_ID]

BASE_URL="http://172.31.68.164:3000"

if [ -z "$1" ]; then
  echo "❌ Please provide a vendor ID"
  echo "Usage: ./test-menu-api.sh VENDOR_ID"
  echo ""
  echo "To get vendor ID:"
  echo "  1. Register as vendor in the app"
  echo "  2. Check Supabase → Authentication → Users"
  echo "  3. Or use the vendor_id from registration response"
  exit 1
fi

VENDOR_ID=$1

echo "🧪 Testing Menu API for Vendor: $VENDOR_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Health check
echo "1️⃣  Health Check"
HEALTH=$(curl -s "$BASE_URL/health")
echo "$HEALTH"
if [[ $HEALTH != *"ok"* ]]; then
  echo "❌ Server is not responding!"
  exit 1
fi
echo "✅ Server is running"
echo ""

# Test 2: Get menu (should be empty initially)
echo "2️⃣  GET Menu (Initial)"
MENU_RESPONSE=$(curl -s -X GET "$BASE_URL/api/menu/$VENDOR_ID")
echo "$MENU_RESPONSE" | jq . 2>/dev/null || echo "$MENU_RESPONSE"
echo ""

# Test 3: Create menu item
echo "3️⃣  POST Create Menu Item"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/menu/$VENDOR_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Burger",
    "description": "A delicious test burger",
    "price": 120,
    "category": "Fast Food",
    "is_available": true
  }')
echo "$CREATE_RESPONSE" | jq . 2>/dev/null || echo "$CREATE_RESPONSE"

# Extract item ID
ITEM_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null)
if [ "$ITEM_ID" != "null" ] && [ -n "$ITEM_ID" ] && [ "$ITEM_ID" != "" ]; then
  echo "✅ Item created with ID: $ITEM_ID"
  echo ""
  
  # Test 4: Get menu again (should show new item)
  echo "4️⃣  GET Menu (After Create)"
  curl -s -X GET "$BASE_URL/api/menu/$VENDOR_ID" | jq . 2>/dev/null || curl -s -X GET "$BASE_URL/api/menu/$VENDOR_ID"
  echo ""
  
  # Test 5: Update item
  echo "5️⃣  PUT Update Item"
  UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/menu/$VENDOR_ID/$ITEM_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "price": 150,
      "description": "Updated test burger"
    }')
  echo "$UPDATE_RESPONSE" | jq . 2>/dev/null || echo "$UPDATE_RESPONSE"
  echo "✅ Item updated"
  echo ""
  
  # Test 6: Delete item
  echo "6️⃣  DELETE Item"
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/menu/$VENDOR_ID/$ITEM_ID")
  echo "$DELETE_RESPONSE" | jq . 2>/dev/null || echo "$DELETE_RESPONSE"
  echo "✅ Item deleted"
  echo ""
  
  # Test 7: Verify deletion
  echo "7️⃣  GET Menu (After Delete - should be empty again)"
  curl -s -X GET "$BASE_URL/api/menu/$VENDOR_ID" | jq . 2>/dev/null || curl -s -X GET "$BASE_URL/api/menu/$VENDOR_ID"
  echo ""
else
  echo "❌ Failed to create item. Check server logs."
  echo "Response: $CREATE_RESPONSE"
fi

# Test 8: Import CSV
echo "8️⃣  POST Import CSV"
IMPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/menu/$VENDOR_ID/import" \
  -H "Content-Type: application/json" \
  -d '{
    "csvText": "name,description,price,category,is_available\nPizza,Cheese pizza,200,Italian,true\nPasta,Creamy pasta,180,Italian,true"
  }')
echo "$IMPORT_RESPONSE" | jq . 2>/dev/null || echo "$IMPORT_RESPONSE"
echo ""

# Test 9: Export menu
echo "9️⃣  GET Export Menu"
curl -s -X GET "$BASE_URL/api/menu/export/$VENDOR_ID" | jq . 2>/dev/null || curl -s -X GET "$BASE_URL/api/menu/export/$VENDOR_ID"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests complete!"
echo ""
echo "💡 Tips:"
echo "   - Check server console for detailed logs"
echo "   - Verify data in Supabase → menu_items table"
echo "   - Test from frontend: Vendor Menu Editor screen"

