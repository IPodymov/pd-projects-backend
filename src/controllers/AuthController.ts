import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { validate } from "class-validator";

class AuthController {
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

        res.send({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    };

    static register = async (req: Request, res: Response) => {
        const { name, email, password } = req.body;
        const user = new User();
        user.name = name;
        user.email = email;
        user.password = bcrypt.hashSync(password, 8);
        user.role = UserRole.STUDENT; // Default role

        const userRepository = AppDataSource.getRepository(User);
        try {
            await userRepository.save(user);
        } catch (e) {
            res.status(409).send({ message: "Email already in use" });
            return;
        }

        res.status(201).send({ message: "User created" });
    };
}

export default AuthController;
