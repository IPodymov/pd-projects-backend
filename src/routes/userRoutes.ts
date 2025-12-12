import { Router } from "express";
import UserController from "../controllers/UserController";
import { checkJwt, checkRole } from "../middlewares/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

// Профиль текущего пользователя
router.get("/profile", [checkJwt], UserController.getProfile);
router.patch("/profile", [checkJwt], UserController.updateProfile);

router.get("/", [checkJwt, checkRole([UserRole.ADMIN])], UserController.listAll);
router.get("/search", [checkJwt, checkRole([UserRole.ADMIN, UserRole.UNIVERSITY_STAFF])], UserController.search);
router.post("/", [checkJwt, checkRole([UserRole.ADMIN])], UserController.createUser);
router.delete("/:id", [checkJwt, checkRole([UserRole.ADMIN])], UserController.deleteUser);
router.patch("/:id", [checkJwt], UserController.updateUser);
router.patch("/:id/role", [checkJwt, checkRole([UserRole.ADMIN])], UserController.changeRole);


export default router;
