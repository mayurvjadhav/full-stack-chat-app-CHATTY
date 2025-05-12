import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

export const Rightbar = () => {
  const { getUsers, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const users = useChatStore((s) => s.users);
  const chats = useChatStore((s) => s.chats);

  const chattedUserIds = chats.map((chat) => chat.user._id);
  const unchattedUsers = users.filter(
    (user) => !chattedUserIds.includes(user._id)
  );

  useEffect(() => {
    getUsers();
  }, []);

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside
      className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200"
      style={{
        display: selectedUser && window.innerWidth <= 768 ? "none" : "flex",
      }}
    >
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Find new people</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {unchattedUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${
                selectedUser?._id === user._id
                  ? "bg-base-300 ring-1 ring-base-300"
                  : ""
              }
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
            </div>

            {/* User info - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400">
                {"start conversation"}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};
