// routes/auth.js  (your posted file with minor fixes)
import { Router } from "express";
import supabase from "../../db.js"; // keep as you have
const router = Router();

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email & password required" });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("signin error:", error);
      return res.status(401).json({ message: error.message ?? "Invalid credentials" });
    }

    const session = data.session;
    const user = data.user;

    if (!session || !user) {
      return res.status(500).json({ message: "Signin failed: no session returned" });
    }

    const accessToken = session.access_token;
    const refreshToken = session.refresh_token;

    const isProd = process.env.NODE_ENV === "production";

    // Set secure, HttpOnly cookies — these cookies are for Http-only session usage
    res.cookie("sb-access-token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: session.expires_in ? session.expires_in * 1000 : 60 * 60 * 1000,
    });

    res.cookie("sb-refresh-token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Fetch profile row (optional)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("fetch profile error:", profileError);
      // Still return user & session — profile may be missing
      console.log(user, session, null);
      return res.status(200).json({ user, session, warning: "Profile not found" });
    }

    console.log(user, session, profileData);
    return res.json({ user, session, profile: profileData });
  } catch (err) {
    console.error("signin catch:", err);
    return res.status(500).json({ message: "Signin failed" });
  }
});

router.post("/signout", async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie("sb-access-token");
    res.clearCookie("sb-refresh-token");

    // If you want to revoke server-side session: call Supabase signOut
    // but usually clearing cookies + client tokens is sufficient for prototype.

    return res.json({ message: "Signed out" });
  } catch (err) {
    console.error("signout error:", err);
    return res.status(500).json({ message: "Signout failed" });
  }
});

export default router;