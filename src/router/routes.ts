import { Router } from "express";
import userRoutes from "../modules/user/user.route";

const router = Router();

router.use("/auth", userRoutes);

export default router;