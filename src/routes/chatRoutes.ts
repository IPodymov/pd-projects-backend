import { Router } from "express";
import ChatController from "../controllers/ChatController";
import { checkJwt, checkRole } from "../middlewares/authMiddleware";
import { UserRole } from "../entities/User";

const router = Router();

// Get class chat (all authenticated users)
router.get("/class", [checkJwt], ChatController.getClassChat);

// Get messages with pagination
router.get("/:chatId/messages", [checkJwt], ChatController.getMessages);

// Send message to class chat
router.post("/:chatId/messages", [checkJwt], ChatController.sendMessage);

// Delete message (own or admin)
router.delete("/messages/:messageId", [checkJwt], ChatController.deleteMessage);

// Create class chat (admin only)
router.post(
  "/create",
  [checkJwt, checkRole([UserRole.ADMIN])],
  ChatController.createClassChat
);

export default router;
