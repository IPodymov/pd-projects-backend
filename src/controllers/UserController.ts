import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import * as bcrypt from "bcryptjs";
// GitHub OAuth removed
import { ILike } from "typeorm";

class UserController {
  // Получение профиля текущего пользователя
  static getProfile = async (req: Request, res: Response) => {
    const userId = res.locals.jwtPayload.userId;
    const userRepository = AppDataSource.getRepository(User);

    try {
      const user = await userRepository.findOneOrFail({
        where: { id: userId },
        relations: ["school", "schoolClass"],
      });

      const { password: _, ...userWithoutPassword } = user;
      res.send(userWithoutPassword);
    } catch {
      res.status(404).send({ message: "User not found" });
    }
  };

  // Обновление профиля текущего пользователя (упрощённый endpoint)
  static updateProfile = async (req: Request, res: Response) => {
    const userId = res.locals.jwtPayload.userId;
    const { name, email, password, schoolId, schoolClassId } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    let user;
    try {
      user = await userRepository.findOneOrFail({
        where: { id: userId },
        relations: ["school", "schoolClass"],
      });
    } catch {
      res.status(404).send({ message: "User not found" });
      return;
    }

    // Обновление имени
    if (name !== undefined && name.trim() !== "") {
      user.name = name.trim();
    }

    // Обновление email с проверкой уникальности
    if (email !== undefined && email.trim() !== "") {
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        res.status(409).send({ message: "Email already in use" });
        return;
      }
      user.email = email.trim().toLowerCase();
    }

    // Обновление пароля (только если передан)
    if (password !== undefined && password.trim() !== "") {
      if (password.length < 6) {
        res.status(400).send({ message: "Password must be at least 6 characters" });
        return;
      }
      user.password = bcrypt.hashSync(password, 8);
    }

    // Обновление школы/класса в зависимости от роли
    // Студент: НЕ может менять школу и класс
    // Учитель: может менять только школу (не класс)
    // Админ и Сотрудник вуза: могут менять все поля
    if (user.role === UserRole.ADMIN || user.role === UserRole.UNIVERSITY_STAFF) {
      // Админы и сотрудники могут обновлять все поля
      if (schoolId !== undefined) {
        user.schoolId = schoolId;
      }
      if (schoolClassId !== undefined) {
        user.schoolClassId = schoolClassId;
      }
    } else if (user.role === UserRole.TEACHER) {
      // Учитель может менять только школу
      if (schoolId !== undefined) {
        user.schoolId = schoolId;
      }
    }
    // Студент не может менять schoolId и schoolClassId

    try {
      await userRepository.save(user);

      // Перезагрузить пользователя с отношениями
      const updatedUser = await userRepository.findOne({
        where: { id: userId },
        relations: ["school", "schoolClass"],
      });

      const { password: _, ...userWithoutPassword } = updatedUser!;

      res.send({
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
    } catch {
      res.status(500).send({ message: "Error updating profile" });
    }
  };

  static listAll = async (req: Request, res: Response) => {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      select: ["id", "name", "email", "role"],
    });
    res.send(users);
  };

  static search = async (req: Request, res: Response) => {
    const { email } = req.query;
    if (!email) {
      res.status(400).send({ message: "Email query parameter is required" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    try {
      const users = await userRepository.find({
        where: {
          email: ILike(`%${email}%`),
        },
        relations: ["school", "schoolClass"],
        select: ["id", "name", "email", "role"],
      });
      res.send(users);
    } catch {
      res.status(500).send({ message: "Error searching users" });
    }
  };

  static createUser = async (req: Request, res: Response) => {
    const { name, email, password, role, schoolId } = req.body;
    const user = new User();
    user.name = name;
    user.email = email;
    user.password = bcrypt.hashSync(password, 8);
    user.role = role;
    user.schoolId = schoolId;

    const userRepository = AppDataSource.getRepository(User);
    try {
      await userRepository.save(user);
    } catch {
      res.status(409).send({ message: "Email already in use" });
      return;
    }
    res.status(201).send({ message: "User created" });
  };

  static deleteUser = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const userRepository = AppDataSource.getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail({ where: { id } });
    } catch {
      res.status(404).send({ message: "User not found" });
      return;
    }
    await userRepository.remove(user);
    res.status(204).send();
  };

  static changeRole = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { role } = req.body;
    const userRepository = AppDataSource.getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail({ where: { id } });
    } catch {
      res.status(404).send({ message: "User not found" });
      return;
    }
    user.role = role;
    await userRepository.save(user);
    res.status(204).send();
  };

  static updateUser = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, email, password, schoolId, schoolClassId } = req.body;

    const currentUserId = parseInt(res.locals.jwtPayload.userId);
    const currentUserRole = res.locals.jwtPayload.role;

    if (isNaN(id)) {
      res.status(400).send({ message: "Invalid user ID" });
      return;
    }

    // Allow admin to update anyone, or user to update themselves
    if (id !== currentUserId && currentUserRole !== UserRole.ADMIN) {
      res.status(403).send({ message: "Forbidden" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    let user;
    try {
      user = await userRepository.findOneOrFail({ where: { id } });
    } catch {
      res.status(404).send({ message: "User not found" });
      return;
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      // Check if email is taken by another user
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser && existingUser.id !== id) {
        res.status(409).send({ message: "Email already in use" });
        return;
      }
      user.email = email;
    }
    if (password !== undefined) {
      user.password = bcrypt.hashSync(password, 8);
    }

    // Role specific updates
    // If the user being updated is a STUDENT
    if (user.role === UserRole.STUDENT) {
      if (schoolId !== undefined) {
        user.schoolId = schoolId;
      }
      if (schoolClassId !== undefined) {
        user.schoolClassId = schoolClassId;
      }
    }
    // If the user being updated is a TEACHER
    else if (user.role === UserRole.TEACHER) {
      if (schoolId !== undefined) {
        user.schoolId = schoolId;
      }
    }

    // Admin can force update these fields for any role if needed,
    // but strictly speaking they only apply to Student/Teacher.
    // If Admin is updating a Student/Teacher, the above logic covers it.
    // If Admin is updating another Admin/Staff, these fields might not be relevant.

    try {
      await userRepository.save(user);
    } catch {
      res.status(500).send({ message: "Error updating user" });
      return;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.cookie("user", JSON.stringify(userWithoutPassword), {
      maxAge: 3600000,
      httpOnly: false,
    });

    res.send(userWithoutPassword);
  };

  // linkGithub endpoint removed
}

export default UserController;
