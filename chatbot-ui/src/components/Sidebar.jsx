const Sidebar = ({
  chats,
  activeChatId,
  setActiveChatId,
  createNewChat,
  deleteChat, // ✅ REQUIRED
}) => {
  return (
    <div className="w-64 bg-[#020617]/95 border-r border-[#1f2937] flex flex-col h-full">

      {/* New Chat Button */}
      <button
        onClick={createNewChat}
        className="m-4 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 hover:brightness-110 active:scale-95 transition-all duration-150 ease-out shadow-sm hover:shadow-md font-medium text-sm"
      >
        + New Chat
      </button>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setActiveChatId(chat.id)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-150 ease-out group hover:scale-[1.01] hover:brightness-110 active:scale-95 ${
              activeChatId === chat.id
                ? "bg-slate-800 border border-slate-700 text-gray-100 shadow-sm"
                : "text-gray-300 hover:bg-slate-800/50"
            }`}
          >
            {/* Title */}
            <span className="truncate font-medium">{chat.title}</span>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // ✅ prevent switching chat
                deleteChat(chat.id);
              }}
              className="text-gray-500 hover:text-red-400 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-all duration-150 ease-out hover:brightness-110 active:scale-95"
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