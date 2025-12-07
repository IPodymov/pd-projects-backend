import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import * as bcrypt from "bcryptjs";

class UserController {
  static listAll = async (req: Request, res: Response) => {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      select: ["id", "name", "email", "role"],
    });
    res.send(users);
  };

  static createUser = async (req: Request, res: Response) => {
    const { name, email, password, role, schoolNumber } = req.body;
    const user = new User();
    user.name = name;
    user.email = email;
    user.password = bcrypt.hashSync(password, 8);
    user.role = role;
    user.schoolNumber = schoolNumber;

    const userRepository = AppDataSource.getRepository(User);
    try {
      await userRepository.save(user);
    } catch (e) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(404).send({ message: "User not found" });
      return;
    }
    user.role = role;
    await userRepository.save(user);
    res.status(204).send();
  };
}

export default UserController;
