import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { School } from "../entities/School";
import { SchoolClass } from "../entities/SchoolClass";
import { ILike } from "typeorm";

// Вспомогательная функция для создания стандартных классов
async function createDefaultClassesForSchool(schoolId: number) {
  const classRepository = AppDataSource.getRepository(SchoolClass);

  // Проверить, есть ли уже классы у этой школы
  const existingClasses = await classRepository.find({
    where: { schoolId },
  });

  if (existingClasses.length === 0) {
    // Создать 3 стандартных класса
    const defaultClasses = ["9 класс", "10 класс", "11 класс"];

    for (const className of defaultClasses) {
      const schoolClass = new SchoolClass();
      schoolClass.name = className;
      schoolClass.schoolId = schoolId;
      await classRepository.save(schoolClass);
    }
  }
}

class SchoolController {
  // Получение списка всех школ с опциональным поиском (публичный доступ для регистрации)
  static listSchools = async (req: Request, res: Response) => {
    const { search } = req.query;
    const schoolRepository = AppDataSource.getRepository(School);

    try {
      let schools;

      if (search && typeof search === "string") {
        // Поиск по номеру, названию или городу
        schools = await schoolRepository.find({
          where: [
            { number: ILike(`%${search}%`) },
            { name: ILike(`%${search}%`) },
            { city: ILike(`%${search}%`) },
          ],
          order: { number: "ASC" },
        });
      } else {
        // Получение всех школ
        schools = await schoolRepository.find({
          order: { number: "ASC" },
        });
      }

      res.send(schools);
    } catch {
      res.status(500).send({ message: "Error fetching schools" });
    }
  };

  // Получение конкретной школы по ID с классами
  static getSchool = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const schoolRepository = AppDataSource.getRepository(School);

    try {
      const school = await schoolRepository.findOneOrFail({
        where: { id },
        relations: ["classes"],
        order: { classes: { name: "ASC" } },
      });
      res.send(school);
    } catch {
      res.status(404).send({ message: "School not found" });
    }
  };

  // Получение классов для конкретной школы (публичный доступ для регистрации)
  static getSchoolClasses = async (req: Request, res: Response) => {
    const schoolId = parseInt(req.params.schoolId);
    const { search } = req.query;
    const classRepository = AppDataSource.getRepository(SchoolClass);

    try {
      let classes;

      if (search && typeof search === "string") {
        // Поиск классов по названию
        classes = await classRepository.find({
          where: {
            schoolId,
            name: ILike(`%${search}%`),
          },
          relations: ["school"],
          order: { name: "ASC" },
        });
      } else {
        // Получение всех классов школы
        classes = await classRepository.find({
          where: { schoolId },
          relations: ["school"],
          order: { name: "ASC" },
        });
      }

      res.send(classes);
    } catch {
      res.status(500).send({ message: "Error fetching classes" });
    }
  };

  // Получение всех классов с опциональным поиском
  static listClasses = async (req: Request, res: Response) => {
    const { search, schoolId } = req.query;
    const classRepository = AppDataSource.getRepository(SchoolClass);

    try {
      let classes;
      const where: any = {};

      if (schoolId && typeof schoolId === "string") {
        where.schoolId = parseInt(schoolId);
      }

      if (search && typeof search === "string") {
        where.name = ILike(`%${search}%`);
      }

      classes = await classRepository.find({
        where: Object.keys(where).length > 0 ? where : undefined,
        relations: ["school"],
        order: { name: "ASC" },
      });

      res.send(classes);
    } catch {
      res.status(500).send({ message: "Error fetching classes" });
    }
  };

  // Создание школы (Admin only)
  static createSchool = async (req: Request, res: Response) => {
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

      // Автоматически создать 3 класса для новой школы
      await createDefaultClassesForSchool(school.id);

      // Загрузить школу с классами для ответа
      const schoolWithClasses = await schoolRepository.findOne({
        where: { id: school.id },
        relations: ["classes"]
      });

      res.status(201).send(schoolWithClasses);
    } catch (error: any) {
      if (error.code === "23505") {
        res.status(409).send({ message: "School number already exists" });
      } else {
        res.status(500).send({ message: "Error creating school" });
      }
    }
  };

  // Обновление школы (Admin only)
  static updateSchool = async (req: Request, res: Response) => {
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
    } catch {
      res.status(404).send({ message: "School not found" });
    }
  };

  // Удаление школы (Admin only)
  static deleteSchool = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const schoolRepository = AppDataSource.getRepository(School);
    try {
      const school = await schoolRepository.findOneOrFail({ where: { id } });
      await schoolRepository.remove(school);
      res.status(204).send();
    } catch {
      res.status(404).send({ message: "School not found" });
    }
  };

  // Добавление класса в школу (Admin only)
  static createClass = async (req: Request, res: Response) => {
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
      schoolClass.schoolId = schoolId;

      await classRepository.save(schoolClass);
      res.status(201).send(schoolClass);
    } catch {
      res.status(404).send({ message: "School not found" });
    }
  };

  // Обновление класса (Admin only)
  static updateClass = async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const { name } = req.body;

    const classRepository = AppDataSource.getRepository(SchoolClass);
    try {
      const schoolClass = await classRepository.findOneOrFail({
        where: { id: classId },
      });
      if (name !== undefined) schoolClass.name = name;

      await classRepository.save(schoolClass);
      res.send(schoolClass);
    } catch {
      res.status(404).send({ message: "Class not found" });
    }
  };

  // Удаление класса (Admin only)
  static deleteClass = async (req: Request, res: Response) => {
    const classId = parseInt(req.params.classId);
    const classRepository = AppDataSource.getRepository(SchoolClass);

    try {
      const schoolClass = await classRepository.findOneOrFail({
        where: { id: classId },
      });
      await classRepository.remove(schoolClass);
      res.status(204).send();
    } catch {
      res.status(404).send({ message: "Class not found" });
    }
  };
}

export default SchoolController;
