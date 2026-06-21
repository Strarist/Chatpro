import { memo, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AppLogo from "./AppLogo";
import ChatListItem from "./sidebar/ChatListItem";
import { sortChatsByPin } from "../utils/chatMetadata";

const Sidebar = ({
  chats,
  activeChatId,
  pinnedIds,
  setActiveChatId,
  createNewChat,
  deleteChat,
  renameChat,
  togglePinChat,
  shareChat,
  isOpen,
  onCloseMobile,
}) => {
  const [toast, setToast] = useState("");

  const { pinned, unpinned } = useMemo(
    () => sortChatsByPin(chats, { pinnedIds }),
    [chats, pinnedIds]
  );

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const handleShare = async (chat) => {
    try {
      await shareChat(chat);
      showToast("Copied to clipboard");
    } catch {
      showToast("Could not copy chat");
    }
  };

  const renderChat = (chat) => (
    <ChatListItem
      key={chat.id}
      chat={chat}
      isActive={activeChatId === chat.id}
      isPinned={pinnedIds.includes(chat.id)}
      onSelect={(id) => {
        setActiveChatId(id);
        onCloseMobile?.();
      }}
      onDelete={deleteChat}
      onRename={renameChat}
      onTogglePin={togglePinChat}
      onShare={handleShare}
    />
  );

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-slate-800/80 bg-[#0f1524] transition-transform duration-300 ease-out md:static md:z-auto md:w-60 md:translate-x-0 lg:w-64 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-3 md:p-4">
        <button
          type="button"
          onClick={() => {
            createNewChat();
            onCloseMobile?.();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800/70 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          <span>New chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 sm:px-3">
        {chats.length > 0 ? (
          <div className="space-y-4">
            {pinned.length > 0 && (
              <section>
                <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Pinned
                </div>
                <div className="space-y-0.5">{pinned.map(renderChat)}</div>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between px-2 pb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {pinned.length > 0 ? "Recent" : "Chats"}
                </span>
                <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  {chats.length}
                </span>
              </div>
              <div className="space-y-0.5">{unpinned.map(renderChat)}</div>
            </section>
          </div>
        ) : (
          <div className="px-3 py-8 text-center">
            <p className="text-sm font-medium text-slate-300">No chats yet</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Start fresh with a new conversation.
            </p>
            <button
              type="button"
              onClick={() => {
                createNewChat();
                onCloseMobile?.();
              }}
              className="mt-4 text-xs font-medium text-blue-300 transition-colors hover:text-blue-200"
            >
              Create your first chat
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800/80 p-3 md:p-4">
        <div className="flex items-center gap-2 px-1 py-1">
          <AppLogo />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-tight text-gray-100">
              ChatPro
            </div>
            <div className="text-xs text-gray-500">AI workspace</div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-700/60 bg-slate-900/95 px-3 py-1.5 text-xs text-slate-200 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
};

export default memo(Sidebar);
