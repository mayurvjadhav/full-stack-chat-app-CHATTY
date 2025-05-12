import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../libs/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  chats: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getChats: async () => {
    try {
      const res = await axiosInstance.get("/messages/sidebar-chats");
      set({ chats: res.data });
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // sendMessages: async (messageData) => {
  //   const { selectedUser, messages = [] } = get();
  //   try {
  //     const res = await axiosInstance.post(
  //       `/messages/send/${selectedUser._id}`,
  //       messageData
  //     );
  //     set({ messages: [...messages, res.data] });
  //   } catch (error) {
  //     console.log(error?.message);
  //   }
  // },

  sendMessages: async (messageData) => {
    const { selectedUser, messages = [], chats = [] } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // 1. Update messages in the chat window
      set({ messages: [...messages, res.data] });

      // 2. Update sidebar (lastMessage & move to top)
      // const updatedChats = [...chats];
      // const chatIndex = updatedChats.findIndex(
      //   (chat) => chat.user._id === selectedUser._id
      // );

      // if (chatIndex !== -1) {
      //   const updatedChat = { ...updatedChats[chatIndex] };
      //   updatedChat.lastMessage = res.data;
      //   updatedChat.unreadCount = 0; // Since you're the sender

      //   // Move chat to top
      //   updatedChats.splice(chatIndex, 1);
      //   updatedChats.unshift(updatedChat);

      //   set({ chats: updatedChats });
      // }
    } catch (error) {
      console.log(error?.message);
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // getMessages: async (userId) => {
  //   set({ isMessagesLoading: true });
  //   try {
  //     const res = await axiosInstance.get(`/messages/${userId}`);
  //     const newMessages = res.data;
  //     console.log(newMessages);
  //     set({ messages: newMessages });

  //     // Update sidebar (last message & unread count) when messages are fetched
  //     const { chats } = get();
  //     const chatIndex = chats.findIndex((chat) => chat.user._id === userId);

  //     if (chatIndex !== -1) {
  //       const updatedChats = [...chats];
  //       const updatedChat = { ...updatedChats[chatIndex] };

  //       // Set last message from fetched messages
  //       updatedChat.lastMessage = newMessages[newMessages.length - 1];
  //       updatedChat.unreadCount = 0; // Reset unread count since user is now in the chat

  //       // Move chat to top if necessary (optional, based on logic you want)
  //       updatedChats.splice(chatIndex, 1);
  //       updatedChats.unshift(updatedChat);

  //       set({ chats: updatedChats }); // Update sidebar with latest chat data
  //     }
  //   } catch (error) {
  //     toast.error(error);
  //   } finally {
  //     set({ isMessagesLoading: false });
  //   }
  // },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", ({ message, sender }) => {
      const { selectedUser, messages, chats } = get();
      const isFromSelectedUser = selectedUser?._id === sender._id;

      // 1. Add new message to message list if you're in that chat
      if (isFromSelectedUser) {
        set({ messages: [...messages, message] });

        // ALSO reset unreadCount locally for that chat
        const updatedChats = chats.map((chat) => {
          if (chat.user._id === selectedUser._id) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        });

        set({ chats: updatedChats });

        // tell backend to also mark as read
        axiosInstance
          .patch(`/messages/mark-read/${selectedUser._id}`)
          .catch(() =>
            console.warn("Failed to sync unread reset with backend")
          );
      } else {
        // You’re not in that chat, bump unread
        const updatedChats = chats.map((chat) => {
          if (chat.user._id === sender._id) {
            return {
              ...chat,
              lastMessage: message,
              unreadCount: (chat.unreadCount || 0) + 1,
            };
          }
          return chat;
        });

        // move chat to top
        const chatIndex = updatedChats.findIndex(
          (chat) => chat.user._id === sender._id
        );
        if (chatIndex > -1) {
          const [movedChat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(movedChat);
        }

        set({ chats: updatedChats });
      }
    });
  },

  // subscribeToMessages: () => {
  //   const socket = useAuthStore.getState().socket;
  //   if (!socket) return;

  //   socket.on("newMessage", async ({ message, sender }) => {
  //     const { selectedUser, messages, chats } = get();
  //     const isFromSelectedUser = selectedUser?._id === sender._id;

  //     // 1. Update messages only if it's the current open chat
  //     if (isFromSelectedUser) {
  //       set({ messages: [...messages, message] });
  //     }
  //     await get().getChats();

  //     // 2. Find chat index
  //     const chatIndex = chats.findIndex((chat) => chat.user._id === sender._id);
  //     if (chatIndex === -1) return;

  //     // 3. Update sidebar chat info
  //     const updatedChats = [...chats];
  //     const updatedChat = { ...updatedChats[chatIndex] };

  //     updatedChat.lastMessage = message;
  //     updatedChat.unreadCount = isFromSelectedUser
  //       ? 0
  //       : (updatedChat.unreadCount || 0) + 1;

  //     // 4. Move to top
  //     updatedChats.splice(chatIndex, 1);
  //     updatedChats.unshift(updatedChat);

  //     set({ chats: updatedChats });
  //   });
  // },
  setSelectedUserAndMarkRead: async (user) => {
    const { chats } = get();

    // Update local unread count
    const updatedChats = chats.map((chat) => {
      if (chat.user._id === user._id) {
        return { ...chat, unreadCount: 0 };
      }
      return chat;
    });

    set({ selectedUser: user, chats: updatedChats });

    // Backend sync
    try {
      await axiosInstance.patch(`/messages/mark-read/${user._id}`);
    } catch (err) {
      console.error("Failed to mark as read:", err.message);
    }
  },
  //   subscribeToMessages: () => {
  //   const socket = useAuthStore.getState().socket;

  //   socket.on("newMessage", ({ message, sender, chatId }) => {
  //     const { selectedUser, messages, chats } = get();
  //     const isFromSelectedUser = selectedUser?._id === sender._id;

  //     // 1. If message is from the currently open chat, add to message list
  //     if (isFromSelectedUser) {
  //       set({ messages: [...messages, message] });
  //     }

  //     // 2. Update the chats sidebar
  //     const updatedChats = [...chats];
  //     const chatIndex = updatedChats.findIndex(chat => chat.user._id === sender._id);

  //     if (chatIndex !== -1) {
  //       const updatedChat = { ...updatedChats[chatIndex] };

  //       // update last message
  //       updatedChat.lastMessage = message;

  //       // bump unread count if it's not open chat
  //       updatedChat.unreadCount = isFromSelectedUser
  //         ? 0
  //         : (updatedChat.unreadCount || 0) + 1;

  //       // move to top
  //       updatedChats.splice(chatIndex, 1);
  //       updatedChats.unshift(updatedChat);

  //       set({ chats: updatedChats });
  //     }
  //   });
  // },

  loadOlderMessages: async (userId, page = 2) => {
    try {
      const res = await axiosInstance.get(`/messages/${userId}?page=${page}`);
      const olderMessages = res.data;

      // Append at top
      set((state) => ({
        messages: [...olderMessages, ...state.messages],
      }));
    } catch (err) {
      console.log("Failed to load older messages:", err.message);
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
