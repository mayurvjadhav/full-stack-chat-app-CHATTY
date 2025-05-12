import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getChatsForSidebar,
  getMessages,
  getUsersForSidebar,
  markChatAsRead,
  sendMessages,
} from "../controllers/message.controller.js";
const router = express.Router();

router.get("/sidebar-chats", protectRoute, getChatsForSidebar);
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessages);
router.patch("/mark-read/:id", protectRoute, markChatAsRead);

export default router;
