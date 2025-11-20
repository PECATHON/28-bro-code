// routes/auth/getMenu.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

// Get vendor menu
router.get("/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ message: error.message });

  res.json(data);
});

export default router;