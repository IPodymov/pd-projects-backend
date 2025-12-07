import { Router } from "express";
import auth from "./authRoutes";
import user from "./userRoutes";
import project from "./projectRoutes";

const routes = Router();

routes.use("/auth", auth);
routes.use("/users", user);
routes.use("/projects", project);

export default routes;
