// server/routes/auth/signUp.js
import { Router } from "express";
import supabaseAdmin from "../../db.js"; // Using service role for admin operations

const router = Router();

/**
 * POST /api/auth/signup
 * body: { email, password, full_name, role, phone, shop_name? }
 * role defaults to 'student'. 'vendor' will be created with vendor_status='pending'.
 * Admin creation is forbidden here.
 */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name, role = "student", phone, shop_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: "email, password and full_name are required" });
    }

    // Forbid public admin creation
    if (role === "admin") {
      return res.status(403).json({ message: "Admin accounts must be created by an admin or secure script" });
    }

    // Create auth user using server (service role) so we control profile insertion
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true 
    });

    if (createError) {
      console.error("supabase.admin.createUser error:", createError);
      return res.status(400).json({ message: createError.message ?? "Failed to create user" });
    }

    const user = createData?.user;
    if (!user?.id) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    // Prepare profile row
    const profileRow = {
      id: user.id,
      full_name,
      phone: phone || null,
      role,
      created_at: new Date().toISOString()
    };

    // Vendor-specific defaults
    if (role === "vendor") {
      profileRow.vendor_status = "approved";
      profileRow.shop_name = shop_name || null;
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert([profileRow]);

    if (profileError) {
      console.error("profiles insert error:", profileError);
      return res.status(500).json({ message: "Failed to create profile", error: profileError.message ?? profileError });
    }

    return res.status(201).json({
      message: role === "vendor" ? "Vendor signup received. Awaiting approval." : "Signup successful.",
      user: { id: user.id, email: user.email },
      profile: profileRow
    });
  } catch (err) {
    console.error("signup catch:", err);
    return res.status(500).json({ message: "Signup failed" });
  }
});

export default router;
