const Sidebar = ({
  chats,
  activeChatId,
  setActiveChatId,
  createNewChat,
  deleteChat, // ✅ REQUIRED
}) => {
  return (
    <div className="w-64 bg-[#020617] border-r border-gray-800 flex flex-col">

      {/* New Chat Button */}
      <button
        onClick={createNewChat}
        className="m-4 p-3 bg-blue-600 rounded-xl hover:bg-blue-700"
      >
        + New Chat
      </button>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setActiveChatId(chat.id)}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer text-sm ${
              activeChatId === chat.id
                ? "bg-blue-600"
                : "hover:bg-gray-800"
            }`}
          >
            {/* Title */}
            <span className="truncate">{chat.title}</span>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // ✅ prevent switching chat
                deleteChat(chat.id);
              }}
              className="text-red-400 hover:text-red-200 text-xs ml-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;