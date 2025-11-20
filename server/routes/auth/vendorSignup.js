// server/routes/auth/vendor-signup.js
import { Router } from "express";
import supabaseAdmin from "../../db_admin.js";   // ← SERVICE ROLE CLIENT (IMPORTANT)

const router = Router();

/**
 * POST /api/auth/vendor-signup
 * Creates auth user + vendors table entry (requires service role)
 */
router.post("/vendor-signup", async (req, res) => {
  try {
    const { email, password, full_name, shop_name } = req.body;

    // Validation
    if (!email || !password || !full_name || !shop_name) {
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("📥 Vendor Signup Request:", req.body);

    // 1️⃣ Create Auth User using service role
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) {
      console.error("❌ createUser error:", error);
      return res.status(400).json({ message: error.message, code: error.code });
    }

    const user = data?.user;
    if (!user?.id) {
      return res.status(500).json({ message: "Failed to create auth user" });
    }

    console.log("🟢 Auth user created:", user.id);

    // 2️⃣ Insert vendor row into vendors table
    const { error: vendorError } = await supabaseAdmin
      .from("vendors")
      .insert([
        {
          id: user.id,
          owner_name: full_name,
          shop_name,
          email,
          phone: null,
          status: "approved",
          created_at: new Date().toISOString(),
        },
      ]);

    if (vendorError) {
      console.error("❌ Vendor insert error:", vendorError);
      return res.status(500).json({
        message: "Vendor creation failed",
        error: vendorError.message,
      });
    }

    console.log("🟢 Vendor inserted into table:", user.id);

    // 3️⃣ Create profile entry with role='vendor' (required for role-based routing)
    const profileRow = {
      id: user.id,
      full_name,
      phone: null,
      role: "vendor",
      created_at: new Date().toISOString(),
    };

    const { error: profileError, data: profileData } = await supabaseAdmin
      .from("profiles")
      .insert([profileRow])
      .select()
      .single();

    if (profileError) {
      console.error("❌ Profile insert error:", profileError);
      // Don't fail the request if profile creation fails, but log it
      // The vendor can still log in, but role might not be set
      console.warn("⚠️ Vendor created but profile creation failed. User may need to set role manually.");
    } else {
      console.log("🟢 Profile created with role='vendor':", user.id);
    }

    // 4️⃣ Respond success
    return res.status(201).json({
      message: "Vendor registered successfully",
      vendor_id: user.id,
      profile: profileData || null,
    });

  } catch (err) {
    console.error("❌ Vendor signup fatal error:", err);
    return res.status(500).json({ message: "Vendor signup failed", error: err.message });
  }
});

export default router;