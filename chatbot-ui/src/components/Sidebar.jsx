const Sidebar = ({
  chats,
  activeChatId,
  setActiveChatId,
  createNewChat,
  deleteChat,
}) => {
  return (
    <div className="flex h-full w-44 shrink-0 flex-col border-r border-[#1e293b] bg-[#010814] sm:w-52 md:w-60 lg:w-64">
      {/* New Chat Button */}
      <div className="p-2.5 sm:p-3 md:p-4">
        <button
          onClick={createNewChat}
          className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/30 transition-all duration-200 ease-out hover:bg-blue-500 hover:brightness-110 hover:shadow-md hover:shadow-blue-950/30 active:scale-[0.98] active:bg-blue-700 sm:px-4"
        >
          + New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3 sm:space-y-1.5 sm:px-3">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setActiveChatId(chat.id)}
            className={`group flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm transition-all duration-200 ease-out active:scale-[0.99] md:px-3 md:py-2.5 ${
              activeChatId === chat.id
                ? "border-slate-700 bg-slate-800/90 text-gray-100 shadow-sm shadow-black/20"
                : "border-transparent text-gray-400 hover:bg-slate-900/70 hover:text-gray-200 hover:shadow-sm hover:shadow-black/10"
            }`}
          >
            {/* Title */}
            <span className="min-w-0 flex-1 truncate font-medium">
              {chat.title}
            </span>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chat.id);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs text-gray-500 opacity-0 transition-all duration-200 ease-out hover:bg-slate-800 hover:text-red-400 active:scale-95 group-hover:opacity-100"
              aria-label="Delete chat"
            >
              x
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-[#1e293b] p-2.5 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 rounded-xl px-1 py-2 text-gray-400 sm:gap-3 sm:px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-xs font-semibold text-gray-300">
            A
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gray-300">
              ChatPro
            </div>
            <div className="text-xs text-gray-500">Workspace</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
