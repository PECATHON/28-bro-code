// routes/auth/signOut.js
import { Router } from "express";

const router = Router();

router.post("/signout", (req, res) => {
  res.clearCookie("sb-access-token");
  res.clearCookie("sb-refresh-token");
  res.json({ message: "signed out" });
});

export default router;