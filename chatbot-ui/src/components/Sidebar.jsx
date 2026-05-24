import AppLogo from "./AppLogo";

const Sidebar = ({ chats, activeChatId, setActiveChatId, createNewChat, deleteChat }) => {
  return (
    <div className="flex h-full w-44 shrink-0 flex-col border-r border-slate-700/40 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900 sm:w-52 md:w-60 lg:w-64 backdrop-blur-xl">
      {/* New Chat Button */}
      <div className="p-2.5 sm:p-3 md:p-4">
        <button
          onClick={createNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition-all duration-300 ease-out hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-950/50 active:scale-[0.97] active:from-blue-700 active:to-blue-600 sm:px-4"
        >
          <span className="text-base leading-none">+</span>
          <span>New Chat</span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3 sm:space-y-1.5 sm:px-3">
        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Chats
        </div>
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setActiveChatId(chat.id)}
            className={`group flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm transition-all duration-200 ease-out active:scale-[0.99] md:px-3 md:py-2.5 ${
              activeChatId === chat.id
                ? "border-blue-500/40 bg-blue-500/10 backdrop-blur-md text-gray-100 shadow-lg shadow-blue-950/20"
                : "border-slate-700/30 text-gray-400 hover:border-slate-600/50 hover:bg-slate-800/40 hover:text-gray-200 hover:shadow-md hover:shadow-black/10 hover:backdrop-blur-md"
            }`}
          >
            {/* Title */}
            <span className="min-w-0 flex-1 truncate font-medium">{chat.title}</span>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chat.id);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs text-gray-500 opacity-0 transition-all duration-200 ease-out hover:bg-red-500/20 hover:text-red-400 active:scale-95 group-hover:opacity-100"
              aria-label="Delete chat"
            >
              x
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700/40 p-2.5 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 rounded-xl px-1 py-2 text-gray-400 sm:gap-3 sm:px-2">
          <AppLogo />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-[-0.01em] text-gray-100">
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
