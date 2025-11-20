// routes/vendor/registerVendor.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

/**
 * POST /api/vendor/register
 * body: { owner_name, shop_name, email, password, phone? }
 */
router.post("/register", async (req, res) => {
  try {
    const { owner_name, shop_name, email, password, phone } = req.body;

    if (!owner_name || !shop_name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // 1) Create auth user
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { owner_name },
      });

    if (createError) {
      console.error("Vendor createUser error:", createError);
      return res.status(400).json({ message: createError.message });
    }

    const user = createData.user;

    // 2) Insert into vendors table
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .insert([
        {
          id: user.id,
          owner_name,
          shop_name,
          email,
          phone: phone || null,
          status: "approved", // or "pending"
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (vendorError) {
      console.error("Insert vendor error:", vendorError);
      return res.status(500).json({
        message: "Vendor data insert failed",
        error: vendorError.message,
      });
    }

    return res.status(201).json({
      message: "Vendor registered successfully",
      vendor: vendorData,
      user,
    });
  } catch (err) {
    console.error("Vendor register catch:", err);
    return res.status(500).json({ message: "Vendor registration failed" });
  }
});

export default router;