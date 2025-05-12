import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { MessageSkeleton } from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../libs/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    loadOlderMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const isFirstRender = useRef(true);

  const scrollContainerRef = useRef(null);
  const currentPage = useRef(1); // keeps track of pagination
  const loadingOlderMessages = useRef(false);

  const handleScroll = async () => {
    if (!scrollContainerRef.current || loadingOlderMessages.current) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;

    if (scrollTop === 0) {
      loadingOlderMessages.current = true;

      // Capture current scroll height before loading more
      const prevScrollHeight = container.scrollHeight;

      currentPage.current += 1;
      await loadOlderMessages(selectedUser._id, currentPage.current);

      // Use a timeout to ensure DOM has updated
      setTimeout(() => {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - prevScrollHeight;

        loadingOlderMessages.current = false;
      }, 0);
    }
  };

  useEffect(() => {
    getMessages(selectedUser._id);
  }, [selectedUser._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({
        behavior: isFirstRender.current ? "auto" : "smooth",
      });

      // After the first scroll (on opening chat), disable auto mode
      isFirstRender.current = false;
    }
  }, [messages]);

  // Reset this flag when switching to another chat
  useEffect(() => {
    isFirstRender.current = true;
  }, [selectedUser._id]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {Array.isArray(messages) &&
          messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${
                message.senderId === authUser._id ? "chat-end" : "chat-start"
              }`}
              ref={messageEndRef}
            >
              <div className=" chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message?.text && <p>{message?.text}</p>}
              </div>
            </div>
          ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
