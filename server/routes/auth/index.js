import { Router } from "express";
import signUp from "./signUp.js";
import signIn from "./signIn.js";

const router = Router();

router.use(signUp);   // /signup
router.use(signIn);   // /signin, /signout

export default router;