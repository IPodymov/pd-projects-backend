import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Project, ProjectStatus } from "../entities/Project";
import { User, UserRole } from "../entities/User";
import { File, FileType } from "../entities/File";

class ProjectController {
    static listAll = async (req: Request, res: Response) => {
        const projectRepository = AppDataSource.getRepository(Project);
        const projects = await projectRepository.find({
            relations: ["owner", "members", "files"]
        });
        res.send(projects);
    };

    static getOne = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const projectRepository = AppDataSource.getRepository(Project);
        try {
            const project = await projectRepository.findOneOrFail({
                where: { id },
                relations: ["owner", "members", "files"]
            });
            res.send(project);
        } catch (error) {
            res.status(404).send({ message: "Project not found" });
        }
    };

    static createProject = async (req: Request, res: Response) => {
        const { title, description, githubUrl } = req.body;
        const userId = res.locals.jwtPayload.userId;

        const project = new Project();
        project.title = title;
        project.description = description;
        project.githubUrl = githubUrl;
        project.status = ProjectStatus.PENDING;
        
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneBy({ id: userId });
        if (!user) return res.status(404).send("User not found");
        
        project.owner = user;
        project.members = [user]; // Owner is automatically a member

        const projectRepository = AppDataSource.getRepository(Project);
        await projectRepository.save(project);

        res.status(201).send(project);
    };

    static joinProject = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userId = res.locals.jwtPayload.userId;

        const projectRepository = AppDataSource.getRepository(Project);
        const userRepository = AppDataSource.getRepository(User);

        let project;
        try {
            project = await projectRepository.findOneOrFail({
                where: { id },
                relations: ["members"]
            });
        } catch (error) {
            res.status(404).send({ message: "Project not found" });
            return;
        }

        if (project.members.length >= 3) {
            res.status(400).send({ message: "Project is full (max 3 students)" });
            return;
        }

        const user = await userRepository.findOneBy({ id: userId });
        if (!user) return res.status(404).send("User not found");

        if (project.members.some(m => m.id === user.id)) {
             res.status(400).send({ message: "Already a member" });
             return;
        }

        project.members.push(user);
        await projectRepository.save(project);

        res.send({ message: "Joined project" });
    };

    static updateStatus = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        if (!Object.values(ProjectStatus).includes(status)) {
            res.status(400).send({ message: "Invalid status" });
            return;
        }

        const projectRepository = AppDataSource.getRepository(Project);
        let project;
        try {
            project = await projectRepository.findOneOrFail({ where: { id } });
        } catch (error) {
            res.status(404).send({ message: "Project not found" });
            return;
        }

        project.status = status;
        await projectRepository.save(project);
        res.send({ message: "Status updated" });
    };

    static uploadFile = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const { type } = req.body; // document or presentation
        
        if (!req.file) {
            res.status(400).send({ message: "No file uploaded" });
            return;
        }

        const projectRepository = AppDataSource.getRepository(Project);
        let project;
        try {
            project = await projectRepository.findOneOrFail({ where: { id } });
        } catch (error) {
            res.status(404).send({ message: "Project not found" });
            return;
        }

        const file = new File();
        file.filename = req.file.filename;
        file.path = req.file.path;
        file.type = type as FileType;
        file.project = project;

        const fileRepository = AppDataSource.getRepository(File);
        await fileRepository.save(file);

        res.send(file);
    };
}

export default ProjectController;
