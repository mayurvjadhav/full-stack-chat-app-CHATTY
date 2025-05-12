import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Chat from "../models/chat.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getChatsForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 }); //  this does the sidebar sorting!

    const result = chats.map((chat) => {
      const otherUser = chat.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: chat._id,
        user: otherUser,
        lastMessage: chat.lastMessage,
        unreadCount: chat.unreadCount.get(userId.toString()) || 0,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.log("Error in getChatsForSidebar", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// export const getMessages = async (req, res) => {
//   try {
//     const { id: userToChatId } = req.params;
//     const myId = req.user._id;

//     const messages = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: userToChatId },
//         { senderId: userToChatId, receiverId: myId },
//       ],
//     }).sort({ createdAt: 1 });
//     res.status(200).json(messages);
//   } catch (error) {
//     console.log("Error in getMessages controller", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    })
      .sort({ createdAt: -1 }) // get newest first
      .skip(skip)
      .limit(limit);

    res.status(200).json(messages.reverse()); // send them oldest → newest
  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const sendMessages = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    let chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId], $size: 2 },
    });

    if (!chat) {
      chat = new Chat({
        participants: [senderId, receiverId],
        unreadCount: {},
      });
    }

    // Update lastMessage and unreadCount
    chat.lastMessage = newMessage._id;
    const receiverKey = receiverId.toString();
    const currentUnread = chat.unreadCount.get(receiverKey) || 0;
    chat.unreadCount.set(receiverKey, currentUnread + 1);

    await chat.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);
    const sender = await User.findById(senderId).select("-password");
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        message: newMessage,
        sender,
        chatId: chat._id,
      });
    }
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", {
        message: newMessage,
        sender,
        chatId: chat._id,
      });
    }
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessages controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
export const markChatAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.id;

    const chat = await Chat.findOne({
      participants: { $all: [userId, otherUserId], $size: 2 },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.unreadCount.set(userId.toString(), 0);
    await chat.save();

    res.status(200).json({ success: true });
  } catch (err) {
    console.log("Error in markChatAsRead:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
