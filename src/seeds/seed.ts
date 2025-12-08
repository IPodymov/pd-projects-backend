import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entities/User";
import { Project, ProjectStatus } from "../entities/Project";
import { School } from "../entities/School";
import { SchoolClass } from "../entities/SchoolClass";
import { Chat } from "../entities/Chat";
import { Message } from "../entities/Message";
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
    const chatRepository = AppDataSource.getRepository(Chat);
    const messageRepository = AppDataSource.getRepository(Message);
    const invitationRepository = AppDataSource.getRepository(Invitation);

    // Check if data already exists
    const schoolCount = await schoolRepository.count();
    if (schoolCount > 0) {
      console.log("Database already seeded. Skipping...");
      await AppDataSource.destroy();
      return;
    }

    // 1. Create Schools
    console.log("Creating Moscow schools...");
    const school1 = schoolRepository.create({
      number: "101",
      name: "Школа №101",
      city: "Москва",
    });
    const school2 = schoolRepository.create({
      number: "102",
      name: "Школа №102",
      city: "Москва",
    });
    const school3 = schoolRepository.create({
      number: "103",
      name: "Школа №103",
      city: "Москва",
    });

    await schoolRepository.save([school1, school2, school3]);
    console.log("✓ Moscow schools created");

    // 2. Create School Classes
    console.log("Creating classes for Moscow schools...");
    const class101A = schoolClassRepository.create({
      name: "10А",
      school: school1,
    });
    const class102A = schoolClassRepository.create({
      name: "10А",
      school: school2,
    });
    const class103A = schoolClassRepository.create({
      name: "10А",
      school: school3,
    });
    await schoolClassRepository.save([class101A, class102A, class103A]);
    console.log("✓ Classes created");

    // 3. Create Admin
    console.log("Creating admin...");
    const admin = userRepository.create({
      name: "Ivan Podymov",
      email: "podymovv55@gmail.com",
      password: bcrypt.hashSync("_soulGr0k!", 8),
      role: UserRole.ADMIN,
      school: school1,
    });
    await userRepository.save(admin);
    console.log("✓ Admin created");

    // 4. Create Teachers
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
    console.log("Creating Moscow students...");
    const students = [];
    const names1 = [
      "Артем Кузнецов",
      "Илья Смирнов",
      "Даниил Попов",
      "Максим Волков",
      "Александр Морозов",
      "Егор Павлов",
      "Михаил Соколов",
      "Владислав Васильев",
      "Глеб Зайцев",
      "Павел Федоров",
    ];
    const names2 = [
      "Дмитрий Крылов",
      "Сергей Белов",
      "Виктор Громов",
      "Андрей Лебедев",
      "Иван Орлов",
      "Никита Савельев",
      "Василий Кузьмин",
      "Антон Карпов",
      "Игорь Сидоров",
      "Виталий Егоров",
    ];
    const names3 = [
      "Владимир Титов",
      "Олег Козлов",
      "Роман Киселев",
      "Станислав Шестаков",
      "Анатолий Куликов",
      "Валерий Гаврилов",
      "Григорий Мельников",
      "Петр Соловьев",
      "Борис Чернов",
      "Аркадий Ермаков",
    ];
    for (let i = 0; i < 10; i++) {
      students.push(
        userRepository.create({
          name: names1[i],
          email: `moscow101_${i + 1}@school.ru`,
          password: bcrypt.hashSync("student123", 8),
          role: UserRole.STUDENT,
          school: school1,
          schoolClass: class101A,
        })
      );
      students.push(
        userRepository.create({
          name: names2[i],
          email: `moscow102_${i + 1}@school.ru`,
          password: bcrypt.hashSync("student123", 8),
          role: UserRole.STUDENT,
          school: school2,
          schoolClass: class102A,
        })
      );
      students.push(
        userRepository.create({
          name: names3[i],
          email: `moscow103_${i + 1}@school.ru`,
          password: bcrypt.hashSync("student123", 8),
          role: UserRole.STUDENT,
          school: school3,
          schoolClass: class103A,
        })
      );
    }
    await userRepository.save(students);
    console.log("✓ Moscow students created");

    // 7. Create Projects
    console.log("Creating Moscow projects...");
    const project1 = projectRepository.create({
      title: "Сайт для школьной газеты",
      description: "Новости, статьи и фото от учеников школы №101.",
      githubUrl: "https://github.com/example/school101-news",
      status: ProjectStatus.APPROVED,
      school: school1,
      schoolClass: class101A,
      owner: students[0],
      members: [students[0], students[1], students[2]],
    });
    const project2 = projectRepository.create({
      title: "Мобильное приложение для расписания",
      description: "Удобное расписание уроков для школы №102.",
      githubUrl: "https://github.com/example/school102-schedule",
      status: ProjectStatus.APPROVED,
      school: school2,
      schoolClass: class102A,
      owner: students[10],
      members: [students[10], students[11], students[12]],
    });
    const project3 = projectRepository.create({
      title: "Экологический мониторинг",
      description:
        "Система сбора данных о состоянии воздуха в районе школы №103.",
      githubUrl: "https://github.com/example/school103-eco",
      status: ProjectStatus.PENDING,
      school: school3,
      schoolClass: class103A,
      owner: students[20],
      members: [students[20], students[21]],
    });
    await projectRepository.save([project1, project2, project3]);
    console.log("✓ Moscow projects created");

    // 8. Create Class Chats
    console.log("Creating class chats...");
    const chat101A = chatRepository.create({
      name: "Чат класса 101-10А",
      description: "Групповой чат для класса 101-10А",
      schoolClass: class101A,
    });
    const chat102A = chatRepository.create({
      name: "Чат класса 102-10А",
      description: "Групповой чат для класса 102-10А",
      schoolClass: class102A,
    });
    const chat103A = chatRepository.create({
      name: "Чат класса 103-10А",
      description: "Групповой чат для класса 103-10А",
      schoolClass: class103A,
    });

    const savedChats = await chatRepository.save([
      chat101A,
      chat102A,
      chat103A,
    ]);
    console.log("✓ Class chats created");

    // 9. Create Sample Messages
    console.log("Creating sample messages...");
    const messages = [];

    // Messages in chat 101A
    messages.push(
      messageRepository.create({
        content: "Привет всем! Как дела?",
        chat: savedChats[0],
        author: students[0],
      }),
      messageRepository.create({
        content: "Привет! Хорошо, спасибо!",
        chat: savedChats[0],
        author: students[1],
      }),
      messageRepository.create({
        content: "Кто готов к проекту?",
        chat: savedChats[0],
        author: students[2],
      })
    );

    // Messages in chat 102A
    messages.push(
      messageRepository.create({
        content: "Всем привет из 102!",
        chat: savedChats[1],
        author: students[10],
      }),
      messageRepository.create({
        content: "Кто идет на олимпиаду?",
        chat: savedChats[1],
        author: students[11],
      })
    );

    // Messages in chat 103A
    messages.push(
      messageRepository.create({
        content: "Экология — наше всё!",
        chat: savedChats[2],
        author: students[20],
      }),
      messageRepository.create({
        content: "Кто участвует в проекте?",
        chat: savedChats[2],
        author: students[21],
      })
    );

    await messageRepository.save(messages);
    console.log("✓ Sample messages created");

    // 10. Create Invitations
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
