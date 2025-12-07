import "reflect-metadata";
import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import { AppDataSource } from "./data-source";
import path from "path";

AppDataSource.initialize().then(async () => {

    // Create express app
    const app = express();

    // Middlewares
    app.use(cors());
    app.use(helmet());
    app.use(bodyParser.json());
    app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

    // Routes
    app.use("/", routes);

    // Start express server
    app.listen(3000, () => {
        console.log("Server started on port 3000!");
    });

}).catch(error => console.log(error));
