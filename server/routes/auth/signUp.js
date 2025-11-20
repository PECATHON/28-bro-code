// server/routes/auth/signUp.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name, role = "student", phone, shop_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: "email, password and full_name are required" });
    }

    if (role === "admin") {
      return res.status(403).json({ message: "Admin cannot sign up here" });
    }

    // If vendor we require shop_name (or at least warn)
    if (role === "vendor" && (!shop_name || !shop_name.trim())) {
      return res.status(400).json({ message: "shop_name is required for vendor signup" });
    }

    // Create auth user using service/admin key
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true
    });

    if (createError) {
      console.error("supabase.admin.createUser error:", createError);
      return res.status(400).json({ message: createError.message });
    }

    const user = createData?.user;
    if (!user?.id) {
      console.error("user creation returned no id", createData);
      return res.status(500).json({ message: "User creation failed" });
    }

    const profileRow = {
      id: user.id,
      full_name,
      phone: phone || null,
      role,
      created_at: new Date().toISOString(),
    };

    if (role === "vendor") {
      // Safer default: pending
      profileRow.vendor_status = "pending";
      profileRow.shop_name = shop_name || null;
    }

    // TRY inserting and capture the exact error
    const { data: inserted, error: profileError } = await supabase
      .from("profiles")
      .insert([profileRow])
      .select()
      .single();

    if (profileError) {
      console.error("profiles insert error:", profileError);
      // return the DB error message during development so you can see why it failed
      return res.status(500).json({
        message: "Failed to create profile",
        dbError: profileError.message ?? profileError,
        profileRow
      });
    }

    console.log("profile inserted:", inserted);
    return res.status(201).json({
      message: role === "vendor"
        ? "Vendor signup received (pending approval)"
        : "Signup successful",
      user: { id: user.id, email: user.email },
      profile: inserted
    });

  } catch (err) {
    console.error("signup error:", err);
    return res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

export default router;