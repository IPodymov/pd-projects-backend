import { Router } from "express";
import UserController from "../controllers/UserController";
import { checkJwt, checkRole } from "../middlewares/authMiddleware";
import { UserRole } from "../entities/User";
import { upload } from "../utils/fileUpload";

const router = Router();

router.get("/", [checkJwt, checkRole([UserRole.ADMIN])], UserController.listAll);
router.post("/", [checkJwt, checkRole([UserRole.ADMIN])], UserController.createUser);
router.delete("/:id", [checkJwt, checkRole([UserRole.ADMIN])], UserController.deleteUser);
router.patch("/:id/role", [checkJwt, checkRole([UserRole.ADMIN])], UserController.changeRole);
router.post("/:id/avatar", [checkJwt, upload.single("avatar")], UserController.uploadAvatar);
router.post("/github/link", [checkJwt], UserController.linkGithub);

export default router;
