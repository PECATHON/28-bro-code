import { Router } from "express";
import supabase from "../db.js";

const router = Router();

// This route MUST come before any /:vendorId routes in menu.js
// Express matches routes in order, so this specific route will match /items before the catch-all
router.get("/items", async (req, res) => {
  console.log("[getMenu.js] Route /items hit!");
  try {
    const { vendor_id, category_id } = req.query;
    console.log("[getMenu.js] Fetching menu items with vendor_id:", vendor_id, "category_id:", category_id);

    let query = supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (vendor_id) {
      query = query.eq("vendor_id", vendor_id);
    }
    if (category_id) {
      query = query.eq("category_id", category_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getMenu.js] Error fetching menu items:", error);
      return res.status(500).json({ message: "Failed to fetch menu items", error: error.message });
    }

    console.log("[getMenu.js] Successfully fetched", data?.length || 0, "menu items");
    return res.json({ items: data || [] });
  } catch (err) {
    console.error("[getMenu.js] Exception:", err);
    return res.status(500).json({ message: "Server error fetching menu items", error: err.message });
  }
});

export default router;
