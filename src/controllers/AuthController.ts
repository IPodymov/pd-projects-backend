import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import { Invitation } from "../entities/Invitation";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { validate } from "class-validator";
import * as crypto from "crypto";

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

    res.send({
      link: `${req.protocol}://${req.get("host")}/auth/register?token=${
        invitation.token
      }`,
      token: invitation.token,
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
      user = await userRepository.findOneOrFail({ where: { email } });
    } catch (error) {
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

    res.cookie("user", JSON.stringify(userWithoutPassword), {
      maxAge: 3600000,
      httpOnly: false,
    });

    res.send({
      token,
      user: userWithoutPassword,
    });
  };

  static register = async (req: Request, res: Response) => {
    const { name, email, password, schoolNumber, classNumber, token } =
      req.body;
    const user = new User();
    user.name = name;
    user.email = email;
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
        user.schoolNumber = invitation.schoolNumber;
      } catch (error) {
        res.status(400).send({ message: "Invalid invitation token" });
        return;
      }
    } else {
      user.role = UserRole.STUDENT; // Default role
      user.schoolNumber = schoolNumber;
      user.classNumber = classNumber;
    }

    const userRepository = AppDataSource.getRepository(User);
    try {
      await userRepository.save(user);
    } catch (e) {
      res.status(409).send({ message: "Email already in use" });
      return;
    }

    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.cookie("user", JSON.stringify(userWithoutPassword), {
      maxAge: 3600000,
      httpOnly: false,
    });

    res.status(201).send({ 
        message: "User created",
        token: jwtToken,
        user: userWithoutPassword
    });
  };
}

export default AuthController;
