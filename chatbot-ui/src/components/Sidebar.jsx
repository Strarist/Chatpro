import AppLogo from "./AppLogo";

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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600/90 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-blue-950/20 transition-all duration-200 ease-out hover:bg-blue-500 hover:shadow-md hover:shadow-blue-950/25 active:scale-[0.98] active:bg-blue-700 sm:px-4"
        >
          <span className="text-base leading-none">+</span>
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3 sm:space-y-1.5 sm:px-3">
        <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-600">
          Chats
        </div>
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
          <AppLogo />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-[-0.01em] text-gray-200">
              ChatPro
            </div>
            <div className="text-xs text-gray-500">AI workspace</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
