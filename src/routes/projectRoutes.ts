import { Router } from "express";
import ProjectController from "../controllers/ProjectController";
import { checkJwt, checkRole } from "../middlewares/authMiddleware";
import { UserRole } from "../entities/User";
import { upload } from "../utils/fileUpload";

const router = Router();

// Public or Authenticated
router.get("/", [checkJwt], ProjectController.listAll);
router.get("/:id", [checkJwt], ProjectController.getOne);

// Create Project (All roles can create, but status depends on role)
router.post(
  "/",
  [checkJwt, checkRole([UserRole.STUDENT, UserRole.ADMIN, UserRole.TEACHER, UserRole.UNIVERSITY_STAFF])],
  ProjectController.createProject
);
router.post(
  "/:id/join",
  [checkJwt, checkRole([UserRole.STUDENT])],
  ProjectController.joinProject
);
router.post(
  "/:id/upload",
  [checkJwt, upload.single("file")],
  ProjectController.uploadFile
);

// Update Project (General update)
router.patch(
  "/:id",
  [checkJwt],
  ProjectController.updateProject
);

// Teacher / Staff / Admin
router.patch(
  "/:id/status",
  [
    checkJwt,
    checkRole([UserRole.TEACHER, UserRole.UNIVERSITY_STAFF, UserRole.ADMIN]),
  ],
  ProjectController.updateStatus
);

// Admin only
router.delete(
  "/:id",
  [checkJwt, checkRole([UserRole.ADMIN])],
  ProjectController.deleteProject
);

export default router;
