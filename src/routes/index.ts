import { Router } from "express";
import auth from "./authRoutes";
import user from "./userRoutes";
import project from "./projectRoutes";

const routes = Router();

routes.get("/", (req, res) => {
    res.send({ message: "PD Projects Backend is running" });
});

routes.use("/auth", auth);
routes.use("/users", user);
routes.use("/projects", project);

export default routes;
