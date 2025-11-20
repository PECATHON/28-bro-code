// routes/auth/menu.js
import { Router } from "express";
import supabaseAdmin from "../../db_admin.js";

const router = Router();

// Add menu item
router.post("/:vendorId/add", async (req, res) => {
  const vendorId = req.params.vendorId;
  const { name, description, price, category, image_url } = req.body;

  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert([
      {
        vendor_id: vendorId,
        name,
        description,
        price,
        category,
        image_url
      }
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });

  res.json(data);
});

export default router;