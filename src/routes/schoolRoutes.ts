import { Router } from "express";
import SchoolController from "../controllers/SchoolController";
import { checkJwt, checkRole } from "../middlewares/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

// Публичные маршруты (для регистрации)
// Получение списка всех школ с поиском
router.get("/", SchoolController.listSchools);

// Получение школы по ID с классами
router.get("/:id", SchoolController.getSchool);

// Получение классов конкретной школы с поиском
router.get("/:schoolId/classes", SchoolController.getSchoolClasses);

// Получение всех классов с поиском (опционально по schoolId)
router.get("/classes/all", SchoolController.listClasses);

// Admin endpoints
// Создание школы
router.post("/", [checkJwt, checkRole([UserRole.ADMIN])], SchoolController.createSchool);

// Обновление школы
router.patch("/:id", [checkJwt, checkRole([UserRole.ADMIN])], SchoolController.updateSchool);

// Удаление школы
router.delete("/:id", [checkJwt, checkRole([UserRole.ADMIN])], SchoolController.deleteSchool);

// Добавление класса в школу
router.post("/:schoolId/classes", [checkJwt, checkRole([UserRole.ADMIN])], SchoolController.createClass);

// Обновление класса
router.patch("/classes/:classId", [checkJwt, checkRole([UserRole.ADMIN])], SchoolController.updateClass);

// Удаление класса
router.delete("/classes/:classId", [checkJwt, checkRole([UserRole.ADMIN])], SchoolController.deleteClass);

export default router;
