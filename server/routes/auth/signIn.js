// routes/auth/signIn.js
import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("signin error:", error);
      return res.status(401).json({ message: error.message });
    }

    const session = data.session;
    const user = data.user;

    if (!session || !user) {
      console.error("signin: missing session or user", data);
      return res.status(500).json({ message: "Signin failed: no session returned" });
    }

    // set cookies for web clients (HttpOnly). Keep sameSite & secure per env.
    res.cookie("sb-access-token", session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    res.cookie("sb-refresh-token", session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    // fetch profile row if exists
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // PGRST116 = no rows returned (single). It's fine if profile missing.
      console.warn("signin profile fetch warning:", profileError);
    }

    console.log("signin user:", user?.id);

    // Return user, session and profile (profile may be null)
    return res.json({ user, session, profile: profileData || null });
  } catch (err) {
    console.error("signin catch:", err);
    return res.status(500).json({ message: "Signin failed", error: err.message });
  }
});

export default router;