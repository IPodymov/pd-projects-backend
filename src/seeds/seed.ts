import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import { Project, ProjectStatus } from "../entities/Project";
import { School } from "../entities/School";
import { SchoolClass } from "../entities/SchoolClass";
import { Invitation } from "../entities/Invitation";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

async function seedDatabase() {
  try {
    // Ensure clean schema for seeding (drops existing tables)
    AppDataSource.setOptions({ synchronize: true, dropSchema: true });
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");

    // Get repositories
    const schoolRepository = AppDataSource.getRepository(School);
    const schoolClassRepository = AppDataSource.getRepository(SchoolClass);
    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);
    const invitationRepository = AppDataSource.getRepository(Invitation);

    // Check if data already exists
    const schoolCount = await schoolRepository.count();
    if (schoolCount > 0) {
      console.log("Database already seeded. Skipping...");
      await AppDataSource.destroy();
      return;
    }

    // 1. Create Schools
    console.log("Creating schools...");
    const school1 = schoolRepository.create({
      number: "1",
      name: "Школа №1",
      city: "Москва",
    });
    const school2 = schoolRepository.create({
      number: "2",
      name: "Школа №2",
      city: "Санкт-Петербург",
    });
    const school3 = schoolRepository.create({
      number: "3",
      name: "Школа №3",
      city: "Казань",
    });

    await schoolRepository.save([school1, school2, school3]);
    console.log("✓ Schools created");

    // 2. Create School Classes
    console.log("Creating school classes...");
    const class1A = schoolClassRepository.create({
      name: "1А",
      school: school1,
    });
    const class1B = schoolClassRepository.create({
      name: "1Б",
      school: school1,
    });
    const class2A = schoolClassRepository.create({
      name: "2А",
      school: school2,
    });
    const class2B = schoolClassRepository.create({
      name: "2Б",
      school: school2,
    });
    const class3A = schoolClassRepository.create({
      name: "3А",
      school: school3,
    });

    await schoolClassRepository.save([
      class1A,
      class1B,
      class2A,
      class2B,
      class3A,
    ]);
    console.log("✓ School classes created");

    // 3. Create Teachers
    console.log("Creating teachers...");
    const teacher1 = userRepository.create({
      name: "Иван Иванов",
      email: "teacher1@example.com",
      password: bcrypt.hashSync("teacher123", 8),
      role: UserRole.TEACHER,
      school: school1,
    });
    const teacher2 = userRepository.create({
      name: "Мария Петрова",
      email: "teacher2@example.com",
      password: bcrypt.hashSync("teacher123", 8),
      role: UserRole.TEACHER,
      school: school2,
    });
    const teacher3 = userRepository.create({
      name: "Сергей Сидоров",
      email: "teacher3@example.com",
      password: bcrypt.hashSync("teacher123", 8),
      role: UserRole.TEACHER,
      school: school3,
    });

    await userRepository.save([teacher1, teacher2, teacher3]);
    console.log("✓ Teachers created");

    // 5. Create University Staff
    console.log("Creating university staff...");
    const staff1 = userRepository.create({
      name: "Алексей Александров",
      email: "staff1@example.com",
      password: bcrypt.hashSync("staff123", 8),
      role: UserRole.UNIVERSITY_STAFF,
      school: school1,
    });
    const staff2 = userRepository.create({
      name: "Елена Егорова",
      email: "staff2@example.com",
      password: bcrypt.hashSync("staff123", 8),
      role: UserRole.UNIVERSITY_STAFF,
      school: school2,
    });

    await userRepository.save([staff1, staff2]);
    console.log("✓ University staff created");

    // 6. Create Students
    console.log("Creating students...");
    const students = [];
    for (let i = 1; i <= 5; i++) {
      const student = userRepository.create({
        name: `Студент ${i}`,
        email: `student${i}@example.com`,
        password: bcrypt.hashSync("student123", 8),
        role: UserRole.STUDENT,
        school: school1,
        schoolClass: class1A,
      });
      students.push(student);
    }

    for (let i = 6; i <= 8; i++) {
      const student = userRepository.create({
        name: `Студент ${i}`,
        email: `student${i}@example.com`,
        password: bcrypt.hashSync("student123", 8),
        role: UserRole.STUDENT,
        school: school1,
        schoolClass: class1B,
      });
      students.push(student);
    }

    for (let i = 9; i <= 12; i++) {
      const student = userRepository.create({
        name: `Студент ${i}`,
        email: `student${i}@example.com`,
        password: bcrypt.hashSync("student123", 8),
        role: UserRole.STUDENT,
        school: school2,
        schoolClass: class2A,
      });
      students.push(student);
    }

    for (let i = 13; i <= 15; i++) {
      const student = userRepository.create({
        name: `Студент ${i}`,
        email: `student${i}@example.com`,
        password: bcrypt.hashSync("student123", 8),
        role: UserRole.STUDENT,
        school: school3,
        schoolClass: class3A,
      });
      students.push(student);
    }

    await userRepository.save(students);
    console.log("✓ Students created");

    // 7. Create Projects
    console.log("Creating projects...");
    const project1 = projectRepository.create({
      title: "Веб-приложение для управления задачами",
      description: "Создание веб-приложения с использованием React и Node.js",
      githubUrl: "https://github.com/example/task-manager",
      status: ProjectStatus.APPROVED,
      school: school1,
      schoolClass: class1A,
      owner: students[0],
      members: [students[0], students[1], students[2]],
    });

    const project2 = projectRepository.create({
      title: "Мобильное приложение для здоровья",
      description: "Приложение для отслеживания физической активности",
      githubUrl: "https://github.com/example/health-app",
      status: ProjectStatus.APPROVED,
      school: school1,
      schoolClass: class1A,
      owner: students[3],
      members: [students[3], students[4]],
    });

    const project3 = projectRepository.create({
      title: "AI чат-бот для образования",
      description: "Интеллектуальный помощник для студентов",
      githubUrl: "https://github.com/example/edu-chatbot",
      status: ProjectStatus.PENDING,
      school: school1,
      schoolClass: class1B,
      owner: students[5],
      members: [students[5]],
    });

    const project4 = projectRepository.create({
      title: "Платформа для онлайн-обучения",
      description: "LMS система с видео уроками и тестами",
      githubUrl: "https://github.com/example/lms-platform",
      status: ProjectStatus.APPROVED,
      school: school2,
      schoolClass: class2A,
      owner: students[8],
      members: [students[8], students[9], students[10]],
    });

    const project5 = projectRepository.create({
      title: "Анализ данных климата",
      description: "Визуализация данных об изменении климата",
      githubUrl: "https://github.com/example/climate-data",
      status: ProjectStatus.REJECTED,
      school: school2,
      schoolClass: class2A,
      owner: students[11],
      members: [students[11]],
    });

    const project6 = projectRepository.create({
      title: "IoT система мониторинга",
      description: "Система для мониторинга параметров окружающей среды",
      status: ProjectStatus.APPROVED,
      school: school3,
      schoolClass: class3A,
      owner: students[12],
      members: [students[12], students[13], students[14]],
    });

    await projectRepository.save([
      project1,
      project2,
      project3,
      project4,
      project5,
      project6,
    ]);
    console.log("✓ Projects created");

    // 7. Create Invitations
    console.log("Creating invitations...");
    const invitation1 = invitationRepository.create({
      token: crypto.randomBytes(32).toString("hex"),
      schoolNumber: "1",
      role: UserRole.TEACHER,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    const invitation2 = invitationRepository.create({
      token: crypto.randomBytes(32).toString("hex"),
      schoolNumber: "2",
      role: UserRole.TEACHER,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const invitation3 = invitationRepository.create({
      token: crypto.randomBytes(32).toString("hex"),
      schoolNumber: "3",
      role: UserRole.TEACHER,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await invitationRepository.save([invitation1, invitation2, invitation3]);
    console.log("✓ Invitations created");

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📋 Test Credentials:");
    console.log("  Teacher:");
    console.log("    Email: teacher1@example.com");
    console.log("    Password: teacher123");
    console.log("\n  Student:");
    console.log("    Email: student1@example.com");
    console.log("    Password: student123");
    console.log("\n  University Staff:");
    console.log("    Email: staff1@example.com");
    console.log("    Password: staff123");

    await AppDataSource.destroy();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
