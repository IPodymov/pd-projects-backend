import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import * as bcrypt from "bcryptjs";
import axios from "axios";

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

  static uploadAvatar = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    // Check if user is updating their own avatar or is admin
    const currentUserId = res.locals.jwtPayload.userId;
    const currentUserRole = res.locals.jwtPayload.role;

    if (id !== currentUserId && currentUserRole !== "admin") {
      res.status(403).send({ message: "Forbidden" });
      return;
    }

    if (!req.file) {
      res.status(400).send({ message: "No file uploaded" });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    let user: User;
    try {
      user = await userRepository.findOneOrFail({ where: { id } });
    } catch (error) {
      res.status(404).send({ message: "User not found" });
      return;
    }

    user.avatarUrl = req.file.path;
    await userRepository.save(user);

    res.send({ message: "Avatar uploaded", avatarUrl: user.avatarUrl });
  };

  static linkGithub = async (req: Request, res: Response) => {
    const { code } = req.body;
    const userId = res.locals.jwtPayload.userId;

    if (!code) {
        res.status(400).send({ message: "GitHub code is required" });
        return;
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            "https://github.com/login/oauth/access_token",
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            },
            {
                headers: { Accept: "application/json" },
            }
        );

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            res.status(400).send({ message: "Failed to get access token from GitHub" });
            return;
        }

        // Get user info from GitHub
        const userResponse = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `token ${accessToken}` },
        });

        const githubUser = userResponse.data;

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneBy({ id: userId });

        if (!user) {
            res.status(404).send({ message: "User not found" });
            return;
        }

        user.githubId = githubUser.id.toString();
        user.githubUsername = githubUser.login;

        await userRepository.save(user);

        res.send({ message: "GitHub profile linked", githubUsername: user.githubUsername });

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error linking GitHub profile" });
    }
  };
}

export default UserController;
