import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import { School } from "../entities/School";
import { SchoolClass } from "../entities/SchoolClass";
import { Invitation } from "../entities/Invitation";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

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

class AuthController {
  static createInvitation = async (req: Request, res: Response) => {
    const { schoolNumber } = req.body;
    if (!schoolNumber) {
      res.status(400).send({ message: "School number is required" });
      return;
    }

    const invitation = new Invitation();
    invitation.schoolNumber = schoolNumber;
    invitation.token = crypto.randomBytes(16).toString("hex");
    invitation.role = UserRole.TEACHER;
    // Expires in 7 days
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitationRepository = AppDataSource.getRepository(Invitation);
    await invitationRepository.save(invitation);

    // Генерация ссылки для фронтенда (можно настроить через env)
    const frontendUrl =
      process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`;
    const invitationLink = `${frontendUrl}/auth/register?token=${invitation.token}`;

    res.send({
      message: "Invitation created successfully",
      invitation: {
        id: invitation.id,
        token: invitation.token,
        schoolNumber: invitation.schoolNumber,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        link: invitationLink,
      },
      // Прямая ссылка для копирования
      invitationLink,
    });
  };

  static login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!(email && password)) {
      res.status(400).send({ message: "Email and password are required" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    let user: User;

    try {
      user = await userRepository.findOneOrFail({
        where: { email },
        relations: ["school", "schoolClass"],
      });
    } catch {
      res.status(401).send({ message: "Invalid credentials" });
      return;
    }

    if (!bcrypt.compareSync(password, user.password)) {
      res.status(401).send({ message: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    const { password: _, ...userWithoutPassword } = user;

    // Кладём в cookie полный профиль пользователя (без пароля), включая связи school/schoolClass
    res.cookie("user", JSON.stringify(userWithoutPassword), {
      maxAge: 3600000,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      // secure можно сделать true в production за счёт HTTPS
      secure: process.env.NODE_ENV === "production",
    });

    res.send({
      token,
      user: userWithoutPassword,
    });
  };

  static register = async (req: Request, res: Response) => {
    const { name, email, password, schoolId, schoolClassId, token } = req.body;

    // Валидация обязательных полей
    if (!name || !email || !password) {
      res.status(400).send({ message: "Name, email, and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).send({ message: "Password must be at least 6 characters" });
      return;
    }

    const user = new User();
    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    user.password = bcrypt.hashSync(password, 8);

    if (token) {
      const invitationRepository = AppDataSource.getRepository(Invitation);
      try {
        const invitation = await invitationRepository.findOneOrFail({
          where: { token },
        });
        if (invitation.expiresAt < new Date()) {
          res.status(400).send({ message: "Invitation expired" });
          return;
        }
        user.role = invitation.role;
        // Get school by number
        const schoolRepository = AppDataSource.getRepository(School);
        const school = await schoolRepository.findOne({
          where: { number: invitation.schoolNumber },
        });
        if (!school) {
          res.status(400).send({ message: "School not found" });
          return;
        }
        user.schoolId = school.id;

        // Создать классы для школы, если их еще нет
        await createDefaultClassesForSchool(school.id);
      } catch {
        res.status(400).send({ message: "Invalid invitation token" });
        return;
      }
    } else {
      if (!schoolId) {
        res.status(400).send({ message: "School ID is required" });
        return;
      }
      user.role = UserRole.STUDENT;
      user.schoolId = schoolId;
      if (schoolClassId) {
        user.schoolClassId = schoolClassId;
      }

      // Создать классы для школы, если их еще нет
      await createDefaultClassesForSchool(schoolId);
    }

    const userRepository = AppDataSource.getRepository(User);
    try {
      await userRepository.save(user);
    } catch {
      res.status(409).send({ message: "Email already in use" });
      return;
    }

    // Перезагрузить пользователя с отношениями для корректной куки
    const savedUser = await userRepository.findOne({
      where: { id: user.id },
      relations: ["school", "schoolClass"],
    });

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    const { password: _, ...userWithoutPassword } = savedUser!;

    res.cookie("user", JSON.stringify(userWithoutPassword), {
      maxAge: 3600000,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).send({
      message: "User created",
      token: jwtToken,
      user: userWithoutPassword,
    });
  };
}

export default AuthController;
