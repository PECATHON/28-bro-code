// routes/auth/signUp.js
import { Router } from "express";
import supabaseAdmin from "../../db.js"; // Using service role for admin operations

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name, role = "student", phone, shop_name } = req.body;

    if (!email || !password || !full_name)
      return res.status(400).json({ message: "Missing fields" });

    if (role === "admin") {
      return res.status(403).json({ message: "Admin cannot sign up here" });
    }

    // If vendor we require shop_name (or at least warn)
    if (role === "vendor" && (!shop_name || !shop_name.trim())) {
      return res.status(400).json({ message: "shop_name is required for vendor signup" });
    }

    // 1. Create auth user with service role
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });

    if (error) return res.status(400).json({ message: error.message });

    const user = data.user;
    if (!user?.id) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    // 2. Create profile row
    const profileRow = {
      id: user.id,
      full_name,
      phone: phone || null,
      role,
      created_at: new Date().toISOString()
    };

    if (role === "vendor") {
      profileRow.vendor_status = "pending";
      profileRow.shop_name = shop_name || null;
    }

    const { data: inserted, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([profileRow])
      .select()
      .single();

    if (profileError) {
      console.error("profiles insert error:", profileError);
      return res.status(500).json({
        message: "Failed to create profile",
        dbError: profileError.message ?? profileError,
        profileRow
      });
    }

    // 3. Vendor table row (if vendor)
    let vendorRow = null;

    if (role === "vendor") {
      const { data: vendorData, error: vendorError } = await supabaseAdmin
        .from("vendors")
        .insert([
          {
            id: user.id,
            owner_name: full_name,
            shop_name,
            email,
            phone: phone || null,
            status: "approved",
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (vendorError) {
        console.error("vendor insert error:", vendorError);
        // Don't fail the request, but log it
        console.warn("Profile created but vendor table insert failed");
      } else {
        vendorRow = vendorData;
      }
    }

    return res.status(201).json({
      message: role === "vendor" ? "Vendor signup received (pending approval)" : "Signup complete",
      user,
      profile: inserted,
      vendor: vendorRow
    });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
