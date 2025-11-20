import { Router } from "express";
import supabase from "../db.js";

const router = Router();

router.get("/items", async (req, res) => {
  try {
    const { vendor_id, category_id } = req.query;

    let query = supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (vendor_id) query = query.eq("vendor_id", vendor_id);
    if (category_id) query = query.eq("category_id", category_id);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching menu items:", error);
      return res.status(500).json({ message: "Failed to fetch menu items" });
    }

    return res.json({ items: data });
  } catch (err) {
    console.error("getMenu error:", err);
    return res.status(500).json({ message: "Server error fetching menu items" });
  }
});

export default router;
