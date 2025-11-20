// server/routes/orders/getStudentOrders.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

/**
 * GET /api/orders/student/:user_id
 * Optional query params: status, limit, offset
 */
router.get("/student/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let q = supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) q = q.in("status", status.split(",").map(s => s.trim()));

    const { data, error } = await q;
    if (error) {
      console.error("getStudentOrders error:", error);
      return res.status(500).json({ error: error.message });
    }
    return res.json({ orders: data });
  } catch (err) {
    console.error("getStudentOrders caught error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
