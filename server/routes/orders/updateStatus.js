// server/routes/orders/updateStatus.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

/**
 * PATCH /api/orders/updateStatus
 * body: { order_id, status, estimated_pickup_time?, pickup_info?, payment_status? }
 */
router.patch("/", async (req, res) => {
  try {
    const { order_id, status, estimated_pickup_time = null, pickup_info = null, payment_status = null } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({ error: "order_id and status are required" });
    }

    const updatePayload = { status, updated_at: new Date().toISOString() };
    if (estimated_pickup_time) updatePayload.estimated_pickup_time = estimated_pickup_time;
    if (pickup_info) updatePayload.pickup_info = pickup_info;
    if (payment_status) updatePayload.payment_status = payment_status;

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", order_id)
      .select()
      .single();

    if (error) {
      console.error("updateStatus error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Optionally create a notification for the student user
    if (data && data.user_id) {
      await supabase.from("notifications").insert({
        user_id: data.user_id,
        title: `Order ${status}`,
        message: `Your order ${order_id} status changed to ${status}`,
        meta: { order_id },
        created_at: new Date().toISOString()
      });
    }

    return res.json({ order: data });
  } catch (err) {
    console.error("updateStatus caught error:", err);
    return res.status(500).json({ error: "Server error updating status" });
  }
});

export default router;
