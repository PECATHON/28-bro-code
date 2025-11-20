// server/routes/getVendors.js
import { Router } from "express";
import supabase from "../db.js";

const router = Router();

// GET /api/vendors/items?owner_id=...&status=approved&search=foo
router.get("/items", async (req, res) => {
  try {
    const { owner_id, status, search } = req.query;

    let query = supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false });

    // optional filters
    if (owner_id) query = query.eq("owner_id", owner_id);
    // Support both old (is_approved/is_active) and new (status) schema
    if (req.query.is_approved !== undefined) {
      const approvedBool = String(req.query.is_approved).toLowerCase() === "true";
      // If status field exists, use it; otherwise check is_approved
      if (approvedBool) {
        query = query.or("status.eq.approved,is_approved.eq.true");
      } else {
        query = query.or("status.neq.approved,is_approved.eq.false");
      }
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (req.query.is_active !== undefined) {
      const activeBool = String(req.query.is_active).toLowerCase() === "true";
      query = query.eq("is_active", activeBool);
    }

    // basic text search on shop_name, owner_name, or email
    if (search) {
      query = query.or(`shop_name.ilike.%${search}%,owner_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching vendors:", error);
      return res.status(500).json({ message: "Failed to fetch vendors", error: error.message });
    }

    // Normalize response - map to expected format
    const normalized = (data || []).map(v => ({
      id: v.id,
      name: v.shop_name || v.name || "Unknown Vendor",
      description: v.description || "",
      owner_name: v.owner_name,
      email: v.email,
      phone: v.phone,
      status: v.status || (v.is_approved ? "approved" : "pending"),
      created_at: v.created_at,
      ...v
    }));

    return res.json({ vendors: normalized });
  } catch (err) {
    console.error("getVendors error:", err);
    return res.status(500).json({ message: "Server error fetching vendors", error: err.message });
  }
});

export default router;