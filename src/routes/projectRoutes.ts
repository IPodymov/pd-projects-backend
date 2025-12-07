import { Router } from "express";
import ProjectController from "../controllers/ProjectController";
import { checkJwt, checkRole } from "../middlewares/authMiddleware";
import { UserRole } from "../entities/User";
import { upload } from "../utils/fileUpload";

const router = Router();

// Public or Authenticated
router.get("/", [checkJwt], ProjectController.listAll);
router.get("/:id", [checkJwt], ProjectController.getOne);

// Student
router.post("/", [checkJwt, checkRole([UserRole.STUDENT])], ProjectController.createProject);
router.post("/:id/join", [checkJwt, checkRole([UserRole.STUDENT])], ProjectController.joinProject);
router.post("/:id/upload", [checkJwt, upload.single("file")], ProjectController.uploadFile);

// Teacher / Staff / Admin
router.patch("/:id/status", [checkJwt, checkRole([UserRole.TEACHER, UserRole.UNIVERSITY_STAFF, UserRole.ADMIN])], ProjectController.updateStatus);

export default router;
