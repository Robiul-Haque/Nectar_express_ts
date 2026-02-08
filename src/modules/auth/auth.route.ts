import { Router } from "express";
import { signUp, verifyOTP } from "./auth.controller";

const router = Router();

router.post("/signup", signUp);
router.post("/verify-otp", verifyOTP);

export default router;