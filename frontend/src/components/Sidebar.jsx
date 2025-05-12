import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
export const Sidebar = () => {
  const {
    getChats,
    messages,
    chats,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const { setSelectedUserAndMarkRead } = useChatStore();

  useEffect(() => {
    getChats();
  }, []);

  const filteredUsers = showOnlineOnly
    ? chats.filter((chat) => onlineUsers.includes(chat._id))
    : chats;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside
        className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200"
        style={{
          display: selectedUser && window.innerWidth <= 768 ? "none" : "flex",
        }}
      >
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Contacts</span>
          </div>
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">
              ({onlineUsers.length - 1} online)
            </span>
          </div>
        </div>

        <div className="overflow-y-auto w-full py-3">
          {filteredUsers.map((chat) => (
            <button
              key={chat.user._id}
              onClick={() => setSelectedUserAndMarkRead(chat.user)}
              className={`
            w-full p-3 flex items-center gap-3
            hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === chat.user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
              ${chat.unreadCount ? "bg-green-950" : ""}
            `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={chat.user.profilePic || "/avatar.png"}
                  alt={chat.user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(chat.user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{chat.user.fullName}</div>
                <div className="text-sm text-zinc-400 truncate">
                  {chat.lastMessage?.text
                    ? chat.lastMessage.text
                    : chat.lastMessage?.image
                    ? "📷 Image"
                    : "No messages yet"}
                </div>
              </div>
              {/* Unread count */}
              {chat.unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full hidden lg:block">
                  {chat.unreadCount}
                </span>
              )}
            </button>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center text-zinc-500 py-4">
              No online users
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
