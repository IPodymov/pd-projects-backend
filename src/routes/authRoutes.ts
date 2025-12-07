import { Router } from "express";
import AuthController from "../controllers/AuthController";
import { checkJwt, checkRole } from "../middlewares/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

router.post("/login", AuthController.login);
router.post("/register", AuthController.register);
router.post("/invite", [checkJwt, checkRole([UserRole.ADMIN, UserRole.UNIVERSITY_STAFF])], AuthController.createInvitation);

export default router;
