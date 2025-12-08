import { Router } from "express";
import auth from "./authRoutes";
import user from "./userRoutes";
import project from "./projectRoutes";
import school from "./schoolRoutes";
import chat from "./chatRoutes";

const routes = Router();

routes.get("/", (req, res) => {
    res.send({ message: "PD Projects Backend is running" });
});

routes.use("/auth", auth);
routes.use("/users", user);
routes.use("/projects", project);
routes.use("/schools", school);
routes.use("/chats", chat);

export default routes;
