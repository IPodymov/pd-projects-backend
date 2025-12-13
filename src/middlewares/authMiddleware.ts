import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { UserRole } from "../entities/User";

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  const token = <string>req.headers["authorization"];
  let jwtPayload;

  try {
    if (!token) {
      res.status(401).send({ message: "Authorization header missing" });
      return;
    }
    const bearer = token.split(" ")[1];
    if (!bearer) {
      res.status(401).send({ message: "Bearer token missing" });
      return;
    }
    jwtPayload = <any>jwt.verify(bearer, process.env.JWT_SECRET || "secret");
    res.locals.jwtPayload = jwtPayload;
  } catch {
    res.status(401).send({ message: "Unauthorized" });
    return;
  }

  next();
};

export const checkRole = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const payload = res.locals.jwtPayload;
    if (roles.indexOf(payload.role) > -1) {
      next();
    } else {
      res.status(403).send({ message: "Forbidden" });
    }
  };
};
