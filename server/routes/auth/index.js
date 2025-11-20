// routes/auth/index.js
import { Router } from "express";
import signUp from "./signUp.js";
import signIn from "./signIn.js";
import signout from "./signout.js";
import vendorSignup from "./vendorSignup.js";

const router = Router();

router.use(signUp);
router.use(signIn);
router.use(signout);
router.use(vendorSignup);

export default router;