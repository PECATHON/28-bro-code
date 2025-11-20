// routes/auth/vendors.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

router.get("/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", vendorId)
    .single();

  if (error) return res.status(500).json({ message: error.message });

  res.json(data);
});

export default router;