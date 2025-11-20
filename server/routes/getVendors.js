// server/routes/vendor/getVendors.js
import { Router } from "express";
import supabase from "../db.js";

const router = Router();

// GET /api/vendors/items?owner_id=...&is_approved=true&is_active=true&search=foo
router.get("/items", async (req, res) => {
  try {
    const { owner_id, is_approved, is_active, search } = req.query;

    let query = supabase
      .from("vendors")
      .select("*")
      .order("created_at", { ascending: false });

    // optional filters
    if (owner_id) query = query.eq("owner_id", owner_id);
    if (typeof is_approved !== "undefined") {
      // accepts "true" / "false" or boolean
      const approvedBool = String(is_approved).toLowerCase() === "true";
      query = query.eq("is_approved", approvedBool);
    }
    if (typeof is_active !== "undefined") {
      const activeBool = String(is_active).toLowerCase() === "true";
      query = query.eq("is_active", activeBool);
    }

    // basic text search on name or description
    if (search) {
      // I use ilike for case-insensitive partial match; adapt if you prefer full-text search
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching vendors:", error);
      return res.status(500).json({ message: "Failed to fetch vendors" });
    }

    return res.json({ vendors: data });
  } catch (err) {
    console.error("getVendors error:", err);
    return res.status(500).json({ message: "Server error fetching vendors" });
  }
});

export default router;
