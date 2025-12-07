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

  static updateUser = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, email, password, schoolNumber, classNumber } = req.body;
    
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
    } catch (error) {
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
        if (schoolNumber !== undefined) user.schoolNumber = schoolNumber;
        if (classNumber !== undefined) user.classNumber = classNumber;
    } 
    // If the user being updated is a TEACHER
    else if (user.role === UserRole.TEACHER) {
        if (schoolNumber !== undefined) user.schoolNumber = schoolNumber;
    }
    
    // Admin can force update these fields for any role if needed, 
    // but strictly speaking they only apply to Student/Teacher.
    // If Admin is updating a Student/Teacher, the above logic covers it.
    // If Admin is updating another Admin/Staff, these fields might not be relevant.

    try {
      await userRepository.save(user);
    } catch (e) {
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

  static uploadAvatar = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);

    // Check if user is updating their own avatar or is admin
    const currentUserId = parseInt(res.locals.jwtPayload.userId);
    const currentUserRole = res.locals.jwtPayload.role;

    if (isNaN(id)) {
      res.status(400).send({ message: "Invalid user ID" });
      return;
    }

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

    user.avatarUrl = req.file.path.replace(/\\/g, "/");
    await userRepository.save(user);

    const { password: _, ...userWithoutPassword } = user;

    res.cookie("user", JSON.stringify(userWithoutPassword), {
      maxAge: 3600000,
      httpOnly: false,
    });

    res.send({ message: "Avatar uploaded", avatarUrl: user.avatarUrl, user: userWithoutPassword });
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

        const { password: _, ...userWithoutPassword } = user;

        res.cookie("user", JSON.stringify(userWithoutPassword), {
            maxAge: 3600000,
            httpOnly: false,
        });

        res.send({ message: "GitHub profile linked", githubUsername: user.githubUsername, user: userWithoutPassword });

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Error linking GitHub profile" });
    }
  };
}

export default UserController;
