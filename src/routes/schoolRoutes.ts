import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { School } from "../entities/School";
import { SchoolClass } from "../entities/SchoolClass";
import { checkJwt, checkRole } from "../middlewares/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

// Get all schools
router.get("/", [checkJwt], async (req: Request, res: Response) => {
  const schoolRepository = AppDataSource.getRepository(School);
  try {
    const schools = await schoolRepository.find({
      relations: ["classes"],
    });
    res.send(schools);
  } catch (error) {
    res.status(500).send({ message: "Error fetching schools" });
  }
});

// Get school by ID with classes
router.get("/:id", [checkJwt], async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const schoolRepository = AppDataSource.getRepository(School);
  try {
    const school = await schoolRepository.findOneOrFail({
      where: { id },
      relations: ["classes"],
    });
    res.send(school);
  } catch (error) {
    res.status(404).send({ message: "School not found" });
  }
});

// Create school (Admin only)
router.post("/", [checkJwt, checkRole([UserRole.ADMIN])], async (req: Request, res: Response) => {
  const { number, name, city } = req.body;

  if (!number || !name) {
    res.status(400).send({ message: "School number and name are required" });
    return;
  }

  const schoolRepository = AppDataSource.getRepository(School);
  const school = new School();
  school.number = number;
  school.name = name;
  school.city = city;

  try {
    await schoolRepository.save(school);
    res.status(201).send(school);
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(409).send({ message: "School number already exists" });
    } else {
      res.status(500).send({ message: "Error creating school" });
    }
  }
});

// Update school (Admin only)
router.patch(
  "/:id",
  [checkJwt, checkRole([UserRole.ADMIN])],
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { number, name, city } = req.body;

    const schoolRepository = AppDataSource.getRepository(School);
    try {
      const school = await schoolRepository.findOneOrFail({ where: { id } });
      if (number !== undefined) school.number = number;
      if (name !== undefined) school.name = name;
      if (city !== undefined) school.city = city;

      await schoolRepository.save(school);
      res.send(school);
    } catch (error) {
      res.status(404).send({ message: "School not found" });
    }
  }
);

// Delete school (Admin only)
router.delete(
  "/:id",
  [checkJwt, checkRole([UserRole.ADMIN])],
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const schoolRepository = AppDataSource.getRepository(School);
    try {
      const school = await schoolRepository.findOneOrFail({ where: { id } });
      await schoolRepository.remove(school);
      res.status(204).send();
    } catch (error) {
      res.status(404).send({ message: "School not found" });
    }
  }
);

// Add class to school (Admin only)
router.post(
  "/:schoolId/classes",
  [checkJwt, checkRole([UserRole.ADMIN])],
  async (req: Request, res: Response) => {
    const schoolId = parseInt(req.params.schoolId);
    const { name } = req.body;

    if (!name) {
      res.status(400).send({ message: "Class name is required" });
      return;
    }

    const schoolRepository = AppDataSource.getRepository(School);
    const classRepository = AppDataSource.getRepository(SchoolClass);

    try {
      const school = await schoolRepository.findOneOrFail({
        where: { id: schoolId },
      });

      const schoolClass = new SchoolClass();
      schoolClass.name = name;
      schoolClass.school = school;

      await classRepository.save(schoolClass);
      res.status(201).send(schoolClass);
    } catch (error) {
      res.status(404).send({ message: "School not found" });
    }
  }
);

// Delete class from school (Admin only)
router.delete(
  "/classes/:classId",
  [checkJwt, checkRole([UserRole.ADMIN])],
  async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const classRepository = AppDataSource.getRepository(SchoolClass);

    try {
      const schoolClass = await classRepository.findOneOrFail({
        where: { id: classId },
      });
      await classRepository.remove(schoolClass);
      res.status(204).send();
    } catch (error) {
      res.status(404).send({ message: "Class not found" });
    }
  }
);

export default router;
