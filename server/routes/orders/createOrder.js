// server/routes/orders/createOrder.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

/**
 * POST /api/orders/create
 * body:
 * {
 *   user_id, vendor_id,
 *   items: [{ item_id, quantity }], // item_id optional if not using menu_items
 *   delivery_info?, pickup_info?, notes?
 * }
 */
router.post("/", async (req, res) => {
  try {
    const { user_id, vendor_id, items, delivery_info = null, pickup_info = null, notes = null } = req.body;

    if (!user_id || !vendor_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "user_id, vendor_id and items are required" });
    }

    // 1) Fetch current menu item prices to validate & compute total (if item_id present)
    const itemIds = items.map(i => i.item_id).filter(Boolean);
    let menuMap = {};
    if (itemIds.length) {
      const { data: menuRows, error: menuErr } = await supabase
        .from("menu_items")
        .select("id, name, price")
        .in("id", itemIds);

      if (menuErr) {
        console.error("menu_items fetch error:", menuErr);
        return res.status(500).json({ error: "Failed to validate menu items" });
      }

      menuMap = menuRows.reduce((acc, r) => { acc[r.id] = r; return acc; }, {});
    }

    // 2) Build order_items with server prices and compute total_amount
    const orderItemsPayload = [];
    let totalAmount = 0;
    for (const it of items) {
      const quantity = Number(it.quantity || 1);
      const menu = it.item_id ? menuMap[it.item_id] : null;
      const unitPrice = menu ? Number(menu.price || 0) : Number(it.unit_price || 0);
      const name = menu ? menu.name : (it.name || "Item");
      const total_price = Number((unitPrice * quantity).toFixed(2));
      totalAmount += total_price;

      orderItemsPayload.push({
        item_id: it.item_id || null,
        name,
        quantity,
        unit_price: unitPrice,
        total_price,
      });
    }

    // Optional: compute estimated_pickup_time (e.g., now + 12 minutes)
    const estimatedPickupTime = new Date(Date.now() + 12 * 60 * 1000).toISOString();

    // 3) Insert order row
    const { data: orderData, error: insertOrderErr } = await supabase
      .from("orders")
      .insert([{
        user_id,
        vendor_id,
        status: "pending",
        total_amount: totalAmount,
        delivery_info,
        pickup_info,
        estimated_pickup_time: estimatedPickupTime,
        // stripe_payment_id & payment_status are left null/pending for now
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (insertOrderErr) {
      console.error("orders insert error:", insertOrderErr);
      return res.status(500).json({ error: insertOrderErr.message });
    }

    const orderId = orderData.id;

    // 4) Insert order_items rows (server-only)
    const itemsToInsert = orderItemsPayload.map(it => ({ ...it, order_id: orderId }));
    if (itemsToInsert.length) {
      const { error: insertItemsErr } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

      if (insertItemsErr) {
        console.error("order_items insert error:", insertItemsErr);
        // rollback: delete created order (service role), to keep DB consistent
        await supabase.from("orders").delete().eq("id", orderId);
        return res.status(500).json({ error: "Failed to insert order items" });
      }
    }

    // 5) Create a notification for the vendor (server)
    const notification = {
      user_id: null, // we will set to vendor owner's user id if you maintain vendor.owner_id mapping
      title: "New Order Received",
      message: `Order ${orderId} placed. Total: ${totalAmount}`,
      meta: { order_id: orderId, vendor_id },
      created_at: new Date().toISOString()
    };

    // Try to resolve vendor owner id to set notification.user_id (optional)
    const { data: vendorRow } = await supabase
      .from("vendors")
      .select("id, owner_id")
      .eq("id", vendor_id)
      .limit(1)
      .single();

    if (vendorRow && vendorRow.owner_id) {
      notification.user_id = vendorRow.owner_id;
    } else {
      // fallback: set null (you can change this behavior)
      notification.user_id = null;
    }

    // Insert notification only if user_id exists
    if (notification.user_id) {
      await supabase.from("notifications").insert(notification);
    }

    // 6) Return created order and items
    const response = {
      order: orderData,
      items: itemsToInsert
    };

    return res.status(201).json(response);
  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ error: "Server error creating order" });
  }
});

export default router;
