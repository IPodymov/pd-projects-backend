import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Chat } from "../entities/Chat";
import { Message } from "../entities/Message";
import { User, UserRole } from "../entities/User";
import { SchoolClass } from "../entities/SchoolClass";

class ChatController {
  // Get all chats for user's class
  static getClassChat = async (req: Request, res: Response) => {
    const userId = res.locals.jwtPayload.userId;
    const userRepository = AppDataSource.getRepository(User);
    const chatRepository = AppDataSource.getRepository(Chat);

    try {
      const user = await userRepository.findOneOrFail({
        where: { id: userId },
        relations: ["schoolClass"],
      });

      if (!user.schoolClassId) {
        return res
          .status(400)
          .send({ message: "User is not assigned to a class" });
      }

      const chat = await chatRepository.findOne({
        where: { schoolClassId: user.schoolClassId },
        relations: ["messages", "messages.author"],
        order: { messages: { createdAt: "ASC" } },
      });

      if (!chat) {
        return res.status(404).send({ message: "Class chat not found" });
      }

      res.send(chat);
    } catch (error) {
      res.status(500).send({ message: "Error fetching class chat" });
    }
  };

  // Send message to class chat
  static sendMessage = async (req: Request, res: Response) => {
    const userId = res.locals.jwtPayload.userId;
    const { content } = req.body;
    const chatId = parseInt(req.params.chatId);

    if (!content || content.trim() === "") {
      return res.status(400).send({ message: "Message content is required" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const chatRepository = AppDataSource.getRepository(Chat);
    const messageRepository = AppDataSource.getRepository(Message);

    try {
      // Verify user belongs to the class chat
      const user = await userRepository.findOneOrFail({
        where: { id: userId },
        relations: ["schoolClass"],
      });

      const chat = await chatRepository.findOneOrFail({
        where: { id: chatId },
      });

      if (chat.schoolClassId !== user.schoolClassId) {
        return res.status(403).send({ message: "Access denied" });
      }

      // Create and save message
      const message = messageRepository.create({
        content: content.trim(),
        chat,
        author: user,
      });

      await messageRepository.save(message);

      // Return message with author info
      const savedMessage = await messageRepository.findOneOrFail({
        where: { id: message.id },
        relations: ["author"],
      });

      res.status(201).send(savedMessage);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error sending message" });
    }
  };

  // Get messages for a specific chat (pagination)
  static getMessages = async (req: Request, res: Response) => {
    const chatId = parseInt(req.params.chatId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const messageRepository = AppDataSource.getRepository(Message);

    try {
      const [messages, total] = await messageRepository.findAndCount({
        where: { chatId },
        relations: ["author"],
        order: { createdAt: "DESC" },
        skip,
        take: limit,
      });

      res.send({
        messages: messages.reverse(), // Return in ascending order
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).send({ message: "Error fetching messages" });
    }
  };

  // Delete message (own messages or admin)
  static deleteMessage = async (req: Request, res: Response) => {
    const userId = res.locals.jwtPayload.userId;
    const userRole = res.locals.jwtPayload.role;
    const messageId = parseInt(req.params.messageId);

    const messageRepository = AppDataSource.getRepository(Message);
    const userRepository = AppDataSource.getRepository(User);

    try {
      const message = await messageRepository.findOneOrFail({
        where: { id: messageId },
        relations: ["author"],
      });

      // Only author or admin can delete
      if (message.userId !== userId && userRole !== UserRole.ADMIN) {
        return res.status(403).send({ message: "Access denied" });
      }

      await messageRepository.remove(message);
      res.send({ message: "Message deleted" });
    } catch (error) {
      res.status(404).send({ message: "Message not found" });
    }
  };

  // Create class chat (when SchoolClass is created) - called by admin
  static createClassChat = async (req: Request, res: Response) => {
    const { schoolClassId } = req.body;
    const userRole = res.locals.jwtPayload.role;

    if (userRole !== UserRole.ADMIN) {
      return res.status(403).send({ message: "Only admin can create chats" });
    }

    const schoolClassRepository = AppDataSource.getRepository(SchoolClass);
    const chatRepository = AppDataSource.getRepository(Chat);

    try {
      const schoolClass = await schoolClassRepository.findOneOrFail({
        where: { id: schoolClassId },
      });

      // Check if chat already exists
      const existingChat = await chatRepository.findOne({
        where: { schoolClassId },
      });

      if (existingChat) {
        return res
          .status(400)
          .send({ message: "Chat already exists for this class" });
      }

      const chat = chatRepository.create({
        name: `Чат класса ${schoolClass.name}`,
        description: `Групповой чат для класса ${schoolClass.name}`,
        schoolClass,
      });

      await chatRepository.save(chat);
      res.status(201).send(chat);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Error creating class chat" });
    }
  };
}

export default ChatController;
