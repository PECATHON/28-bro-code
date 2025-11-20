import { Router } from "express";
import supabase from "../../db.js";

const router = Router();

/**
 * POST /api/auth/signin
 * body: { email, password }
 * Sets HttpOnly cookies for access and refresh tokens and returns user + profile.
 */
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
    // Set secure, HttpOnly cookies
    res.cookie("sb-access-token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: session.expires_in ? session.expires_in * 1000 : 60 * 60 * 1000
    });

    // Refresh token cookie (optional)
    res.cookie("sb-refresh-token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      // keep reasonable lifetime; do not make infinite
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Fetch profile row
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("fetch profile error:", profileError);
      // Return session & user; profile may be missing if DB row wasn't created
      return res.status(200).json({ user, session, warning: "Profile not found" });
    }

    return res.json({ user, session, profile: profileData });
  } catch (err) {
    console.error("signin catch:", err);
    return res.status(500).json({ message: "Signin failed" });
  }
});

/**
 * POST /api/auth/signout
 * Clears cookies from client.
 */
router.post("/signout", async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie("sb-access-token");
    res.clearCookie("sb-refresh-token");

    // Optionally revoke session using access token from cookie/header
    const token = req.cookies?.["sb-access-token"] || (req.headers.authorization || "").replace("Bearer ", "") || null;
    if (token) {
    }

    return res.json({ message: "Signed out" });
  } catch (err) {
    console.error("signout error:", err);
    return res.status(500).json({ message: "Signout failed" });
  }
});

export default router;
