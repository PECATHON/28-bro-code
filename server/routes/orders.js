// server/routes/orders.js
import { Router } from "express";
import supabase from "../db.js";
import supabaseAdmin from "../db_admin.js";

const router = Router();

/**
 * GET /api/orders/test
 * Test endpoint to check if orders table exists and has data
 */
router.get("/test", async (req, res) => {
  try {
    // Check if orders table exists and get count
    const { data: allOrders, error: allError, count: totalCount } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, vendor_id, status, total_amount, created_at, razorpay_order_id", { count: 'exact' })
      .order("created_at", { ascending: false })
      .limit(10);
    
    // Get orders by user_id if provided
    const { userId } = req.query;
    let userOrders = null;
    if (userId) {
      const { data: userOrdersData, error: userError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      userOrders = userOrdersData || [];
      console.log(`📦 Found ${userOrders.length} orders for user ${userId}`);
    }
    
    return res.json({
      success: true,
      message: "Orders table accessible",
      totalOrders: totalCount || 0,
      sampleOrders: allOrders || [],
      userOrders: userOrders,
      userOrdersCount: userOrders ? userOrders.length : null,
      error: allError?.message || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Test failed",
      error: err.message,
    });
  }
});

/**
 * POST /api/orders/test-create
 * Test endpoint to create a sample order (for debugging)
 */
router.post("/test-create", async (req, res) => {
  try {
    const { userId, vendorId, items, total } = req.body;
    
    if (!userId || !vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["userId", "vendorId", "items"],
      });
    }
    
    const orderRecord = {
      razorpay_order_id: `test_${Date.now()}`,
      user_id: userId,
      vendor_id: vendorId,
      items: items,
      total_amount: total || items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0),
      status: "confirmed",
      payment_id: `test_pay_${Date.now()}`,
      payment_method: "test",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log("🧪 Creating test order:", orderRecord);
    
    const { data: createdOrder, error: createError } = await supabaseAdmin
      .from("orders")
      .insert([orderRecord])
      .select()
      .single();
    
    if (createError) {
      console.error("❌ Test order creation failed:", createError);
      return res.status(500).json({
        success: false,
        message: "Failed to create test order",
        error: createError.message,
        error_details: createError,
      });
    }
    
    console.log("✅ Test order created:", createdOrder.id);
    
    return res.json({
      success: true,
      message: "Test order created successfully",
      order: createdOrder,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Test order creation failed",
      error: err.message,
    });
  }
});

/**
 * GET /api/orders
 * Get orders for the current user
 * Query params: ?userId=uuid (required)
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    console.log("📦 GET /api/orders - userId:", userId);

    if (!userId) {
      console.warn("⚠️ GET /api/orders - userId is missing");
      return res.status(400).json({ message: "userId is required" });
    }

    // Fetch orders from database (real-time - no cache)
    console.log("📦 Fetching orders for user_id:", userId, "(real-time from database)");
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }); // Most recent first

    console.log("📦 Orders query result (real-time):", {
      count: orders?.length || 0,
      error: error?.message || null,
      order_ids: orders?.map(o => o.id.substring(0, 8)).join(", ") || "none",
      latest_order: orders?.[0] ? {
        id: orders[0].id.substring(0, 8),
        status: orders[0].status,
        created_at: orders[0].created_at,
      } : null,
    });

    // Fetch vendor information for each order
    const vendorIds = [...new Set((orders || []).map(o => o.vendor_id).filter(Boolean))];
    const vendorsMap = {};
    
    if (vendorIds.length > 0) {
      const { data: vendors, error: vendorsError } = await supabaseAdmin
        .from("vendors")
        .select("id, shop_name, owner_name")
        .in("id", vendorIds);
      
      if (!vendorsError && vendors) {
        vendors.forEach(v => {
          vendorsMap[v.id] = v;
        });
      }
    }

    if (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({
        message: "Failed to fetch orders",
        error: error.message,
      });
    }

    // Transform orders to match frontend format
    const transformedOrders = (orders || []).map((order) => {
      const vendor = vendorsMap[order.vendor_id] || null;
      return {
        id: order.id,
        razorpay_order_id: order.razorpay_order_id,
        status: order.status, // Keep backend status (confirmed, preparing, ready, completed, cancelled)
        total: parseFloat(order.total_amount) || 0,
        placedAt: order.created_at,
        vendor: {
          id: order.vendor_id,
          name: vendor?.shop_name || vendor?.owner_name || "Unknown Vendor", // Use shop_name as primary
        },
        items: Array.isArray(order.items) ? order.items : [],
        reviewed: false, // TODO: Add reviews table later
        payment_id: order.payment_id,
        payment_method: order.payment_method,
      };
    });

    console.log("📦 Returning transformed orders:", transformedOrders.length);
    return res.json({ orders: transformedOrders });
  } catch (err) {
    console.error("❌ GET /api/orders error:", err);
    return res.status(500).json({
      message: "Server error fetching orders",
      error: err.message,
    });
  }
});

/**
 * GET /api/orders/vendor/:vendorId
 * Get orders for a specific vendor
 * MUST come before /:orderId route
 */
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    console.log("📦 GET /api/orders/vendor/:vendorId - vendorId:", vendorId);

    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required" });
    }

    // Fetch orders for this vendor
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    console.log("📦 Vendor orders query result:", {
      count: orders?.length || 0,
      error: error?.message || null,
    });

    if (error) {
      console.error("Error fetching vendor orders:", error);
      return res.status(500).json({
        message: "Failed to fetch vendor orders",
        error: error.message,
      });
    }

    // Fetch user information for each order
    const userIds = [...new Set((orders || []).map(o => o.user_id).filter(Boolean))];
    const usersMap = {};
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      
      if (!profilesError && profiles) {
        profiles.forEach(p => {
          usersMap[p.id] = p;
        });
      }
    }

    // Transform orders to match vendor frontend format
    const transformedOrders = (orders || []).map((order) => {
      const customer = usersMap[order.user_id] || null;
      const items = Array.isArray(order.items) ? order.items : [];
      
      return {
        id: order.id,
        razorpay_order_id: order.razorpay_order_id,
        customer: customer?.full_name || customer?.email || "Unknown Customer",
        customerEmail: customer?.email || null,
        items: items,
        itemsCount: items.length,
        total: parseFloat(order.total_amount) || 0,
        status: order.status, // confirmed, completed, cancelled, etc.
        placedAt: order.created_at,
        payment_id: order.payment_id,
        payment_method: order.payment_method,
      };
    });

    console.log("📦 Returning vendor orders:", transformedOrders.length);
    return res.json({ orders: transformedOrders });
  } catch (err) {
    console.error("❌ GET /api/orders/vendor/:vendorId error:", err);
    return res.status(500).json({
      message: "Server error fetching vendor orders",
      error: err.message,
    });
  }
});

/**
 * GET /api/orders/vendor/:vendorId
 * Get orders for a specific vendor
 * MUST come before /:orderId route to avoid route conflicts
 */
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    console.log("📦 GET /api/orders/vendor/:vendorId - vendorId:", vendorId);

    if (!vendorId) {
      return res.status(400).json({ message: "vendorId is required" });
    }

    // Fetch orders for this vendor
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    console.log("📦 Vendor orders query result:", {
      count: orders?.length || 0,
      error: error?.message || null,
    });

    if (error) {
      console.error("Error fetching vendor orders:", error);
      return res.status(500).json({
        message: "Failed to fetch vendor orders",
        error: error.message,
      });
    }

    // Fetch user information for each order
    const userIds = [...new Set((orders || []).map(o => o.user_id).filter(Boolean))];
    const usersMap = {};
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      
      if (!profilesError && profiles) {
        profiles.forEach(p => {
          usersMap[p.id] = p;
        });
      }
    }

    // Transform orders to match vendor frontend format
    const transformedOrders = (orders || []).map((order) => {
      const customer = usersMap[order.user_id] || null;
      const items = Array.isArray(order.items) ? order.items : [];
      
      return {
        id: order.id,
        razorpay_order_id: order.razorpay_order_id,
        customer: customer?.full_name || customer?.email || "Unknown Customer",
        customerEmail: customer?.email || null,
        items: items,
        itemsCount: items.length,
        total: parseFloat(order.total_amount) || 0,
        status: order.status, // confirmed, completed, cancelled, etc.
        placedAt: order.created_at,
        payment_id: order.payment_id,
        payment_method: order.payment_method,
      };
    });

    console.log("📦 Returning vendor orders:", transformedOrders.length);
    return res.json({ orders: transformedOrders });
  } catch (err) {
    console.error("❌ GET /api/orders/vendor/:vendorId error:", err);
    return res.status(500).json({
      message: "Server error fetching vendor orders",
      error: err.message,
    });
  }
});

/**
 * PUT /api/orders/:orderId/status
 * Update order status (for vendors)
 * body: { status: "confirmed" | "completed" | "cancelled", vendorId, notifyStudent }
 */
router.put("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, vendorId, notifyStudent } = req.body;

    console.log("📦 PUT /api/orders/:orderId/status - orderId:", orderId, "status:", status, "notifyStudent:", notifyStudent);

    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` 
      });
    }

    // Build update query
    let queryBuilder = supabaseAdmin
      .from("orders")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // If vendorId provided, verify vendor owns this order
    if (vendorId) {
      queryBuilder = queryBuilder.eq("vendor_id", vendorId);
    }

    const { data: updatedOrder, error } = await queryBuilder.select().single();

    if (error) {
      console.error("Error updating order status:", error);
      return res.status(500).json({
        message: "Failed to update order status",
        error: error.message,
      });
    }

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Prepare notification data for student on any status change
    let notificationData = null;
    if (notifyStudent) {
      // Fetch vendor info
      const { data: vendor } = await supabaseAdmin
        .from("vendors")
        .select("shop_name, owner_name")
        .eq("id", updatedOrder.vendor_id)
        .single();
      
      const vendorName = vendor?.shop_name || vendor?.owner_name || "Vendor";
      
      // Create appropriate message based on status
      let message = "";
      switch (status) {
        case "preparing":
          message = `Your order from ${vendorName} is now under process.`;
          break;
        case "ready":
          message = `Your order from ${vendorName} is prepared and ready!`;
          break;
        case "completed":
          message = `Your order from ${vendorName} is ready for pickup! 🎉`;
          break;
        case "cancelled":
          message = `Your order from ${vendorName} has been rejected.`;
          break;
        default:
          message = `Your order from ${vendorName} status has been updated to ${status}.`;
      }
      
      notificationData = {
        orderId: updatedOrder.id,
        vendorName: vendorName,
        status: status,
        message: message,
      };
      
      console.log("📱 Notification data prepared for student:", notificationData);
    }

    console.log("✅ Order status updated:", updatedOrder.id, "to", status);
    return res.json({
      success: true,
      message: "Order status updated",
      order: updatedOrder,
      notification: notificationData, // Frontend will handle the actual notification
    });
  } catch (err) {
    console.error("❌ PUT /api/orders/:orderId/status error:", err);
    return res.status(500).json({
      message: "Server error updating order status",
      error: err.message,
    });
  }
});

export default router;

