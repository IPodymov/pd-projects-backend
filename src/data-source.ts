import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./entities/User";
import { Project } from "./entities/Project";
import { File } from "./entities/File";
import { Invitation } from "./entities/Invitation";
import { School } from "./entities/School";
import { SchoolClass } from "./entities/SchoolClass";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true, // Don't use this in production!
  logging: false,
  entities: [User, Project, File, Invitation, School, SchoolClass],
  migrations: [],
  subscribers: [],
});
