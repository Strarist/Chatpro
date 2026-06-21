import AppLogo from "./AppLogo";
import ConnectionStatus from "./ConnectionStatus";

const Sidebar = ({
  chats,
  activeChatId,
  setActiveChatId,
  createNewChat,
  deleteChat,
  isOpen,
  onCloseMobile,
  backendConnected = false,
}) => {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-slate-700/40 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-900 backdrop-blur-xl transition-transform duration-300 ease-out md:static md:z-auto md:w-60 md:translate-x-0 lg:w-64 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-2.5 sm:p-3 md:p-4">
        <button
          onClick={() => {
            createNewChat();
            onCloseMobile?.();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition-all duration-300 ease-out hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-950/50 active:scale-[0.97]"
        >
          <span className="text-base leading-none">+</span>
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3 sm:px-3">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Chats
          </span>
          {chats.length > 0 && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              {chats.length}
            </span>
          )}
        </div>

        {chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
                onCloseMobile?.();
              }}
              className={`group flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2.5 text-sm transition-all duration-200 ease-out active:scale-[0.99] md:px-3 ${
                activeChatId === chat.id
                  ? "border-blue-500/50 bg-blue-500/15 text-gray-100 shadow-md shadow-blue-950/25"
                  : "border-slate-700/30 text-gray-400 hover:border-slate-600/50 hover:bg-slate-800/50 hover:text-gray-200"
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium">{chat.title}</span>
                {chat.messages?.length > 0 && (
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {chat.messages.length} message{chat.messages.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs text-gray-500 opacity-0 transition-all duration-200 ease-out hover:bg-red-500/20 hover:text-red-400 active:scale-95 group-hover:opacity-100"
                aria-label="Delete chat"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <div className="glass-panel mx-1 px-3 py-6 text-center">
            <p className="text-sm font-medium text-slate-300">No conversations yet</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Start a new chat to stream your first AI reply.
            </p>
            <button
              type="button"
              onClick={() => {
                createNewChat();
                onCloseMobile?.();
              }}
              className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-200 transition-colors hover:border-blue-400/50 hover:bg-blue-500/20"
            >
              Start your first chat
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-700/40 p-2.5 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 rounded-xl px-1 py-2 sm:gap-3 sm:px-2">
          <AppLogo />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-tight text-gray-100">
              ChatPro
            </div>
            <div className="text-xs text-gray-500">AI workspace</div>
          </div>
        </div>
        <div className="mt-2 px-1">
          <ConnectionStatus connected={backendConnected} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
