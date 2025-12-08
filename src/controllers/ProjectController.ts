import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Project, ProjectStatus } from "../entities/Project";
import { User, UserRole } from "../entities/User";
import { File, FileType } from "../entities/File";
import { ILike, Brackets } from "typeorm";

class ProjectController {
  static listAll = async (req: Request, res: Response) => {
    const userId = res.locals.jwtPayload.userId;
    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);

    try {
      const user = await userRepository.findOneOrFail({
        where: { id: userId },
        relations: ["school", "schoolClass"],
      });

      const query = projectRepository
        .createQueryBuilder("project")
        .leftJoinAndSelect("project.owner", "owner")
        .leftJoinAndSelect("project.members", "members")
        .leftJoinAndSelect("project.files", "files")
        .leftJoinAndSelect("project.school", "school")
        .leftJoinAndSelect("project.schoolClass", "schoolClass");

      // If user is a student, filter by school and optionally by class
      if (user.role === UserRole.STUDENT) {
        if (user.schoolId) {
          query.andWhere("project.schoolId = :schoolId", {
            schoolId: user.schoolId,
          });
        }
        if (user.schoolClassId) {
          query.andWhere(
            new Brackets((qb) => {
              qb.where("project.schoolClassId = :schoolClassId", {
                schoolClassId: user.schoolClassId,
              }).orWhere("project.schoolClassId IS NULL");
            })
          );
        }
      }
      // If user is a teacher or staff, filter by school
      else if (
        user.role === UserRole.TEACHER ||
        user.role === UserRole.UNIVERSITY_STAFF
      ) {
        if (user.schoolId) {
          query.andWhere("project.schoolId = :schoolId", {
            schoolId: user.schoolId,
          });
        }
      }
      // Admin sees all (no filter)

      const projects = await query.getMany();
      res.send(projects);
    } catch (error) {
      res.status(500).send({ message: "Error fetching projects" });
    }
  };

  static getOne = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const projectRepository = AppDataSource.getRepository(Project);
    try {
      const project = await projectRepository.findOneOrFail({
        where: { id },
        relations: ["owner", "members", "files"],
      });
      res.send(project);
    } catch (error) {
      res.status(404).send({ message: "Project not found" });
    }
  };

  static createProject = async (req: Request, res: Response) => {
    const { title, description, githubUrl, schoolId, schoolClassId } = req.body;
    const userId = res.locals.jwtPayload.userId;
    const userRole = res.locals.jwtPayload.role;

    if (!schoolId) {
      return res.status(400).send({ message: "schoolId is required" });
    }

    const project = new Project();
    project.title = title;
    project.description = description;
    project.githubUrl = githubUrl;
    project.schoolId = schoolId;
    project.schoolClassId = schoolClassId;

    if (
      userRole === UserRole.ADMIN ||
      userRole === UserRole.TEACHER ||
      userRole === UserRole.UNIVERSITY_STAFF
    ) {
      project.status = ProjectStatus.APPROVED;
    } else {
      project.status = ProjectStatus.PENDING;
    }

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
        relations: ["members"],
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

    if (project.members.some((m) => m.id === user.id)) {
      res.status(400).send({ message: "Already a member" });
      return;
    }

    project.members.push(user);
    await projectRepository.save(project);

    res.send({ message: "Joined project" });
  };

  static updateProject = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { title, description, githubUrl, status } = req.body;
    const userId = res.locals.jwtPayload.userId;
    const userRole = res.locals.jwtPayload.role;

    const projectRepository = AppDataSource.getRepository(Project);
    let project;
    try {
      project = await projectRepository.findOneOrFail({
        where: { id },
        relations: ["owner"],
      });
    } catch (error) {
      res.status(404).send({ message: "Project not found" });
      return;
    }

    const isOwner = project.owner.id === userId;
    const isAdminOrTeacher = [
      UserRole.ADMIN,
      UserRole.TEACHER,
      UserRole.UNIVERSITY_STAFF,
    ].includes(userRole);

    if (!isOwner && !isAdminOrTeacher) {
      res.status(403).send({ message: "Not authorized" });
      return;
    }

    if (title !== undefined) {
      if (isOwner) project.title = title;
    }
    if (description !== undefined) {
      if (isOwner) project.description = description;
    }
    if (githubUrl !== undefined) {
      if (isOwner) project.githubUrl = githubUrl;
    }

    if (status !== undefined) {
      if (!isAdminOrTeacher) {
        res.status(403).send({ message: "Not authorized to update status" });
        return;
      }
      if (!Object.values(ProjectStatus).includes(status)) {
        res.status(400).send({ message: "Invalid status" });
        return;
      }
      project.status = status;
    }

    try {
      await projectRepository.save(project);
    } catch (error) {
      res.status(500).send({ message: "Error updating project" });
      return;
    }

    res.send(project);
  };

  static updateStatus = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      res.status(400).send({ message: "Status is required" });
      return;
    }

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

    try {
      await projectRepository.save(project);
    } catch (error) {
      res.status(500).send({ message: "Error updating project status" });
      return;
    }

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

  static deleteProject = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const projectRepository = AppDataSource.getRepository(Project);

    if (isNaN(id)) {
      res.status(400).send({ message: "Invalid project ID" });
      return;
    }

    try {
      const project = await projectRepository.findOneOrFail({ where: { id } });
      await projectRepository.remove(project);
      res.status(204).send();
    } catch (error) {
      res.status(404).send({ message: "Project not found" });
    }
  };
}

export default ProjectController;
