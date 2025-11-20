// server/routes/orders/getVendorOrders.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

/**
 * GET /api/orders/vendor/:vendor_id
 * Optional query params: status (comma-separated), limit, offset
 */
router.get("/vendor/:vendor_id", async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("vendor_id", vendor_id)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      const statuses = status.split(",").map(s => s.trim());
      query = query.in("status", statuses);
    }

    const { data, error } = await query;

    if (error) {
      console.error("getVendorOrders error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ orders: data });
  } catch (err) {
    console.error("getVendorOrders caught error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
