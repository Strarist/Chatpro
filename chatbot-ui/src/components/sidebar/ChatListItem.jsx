import { memo, useEffect, useRef, useState } from "react";
import { Pin, Trash2 } from "lucide-react";
import ChatItemMenu from "./ChatItemMenu";

const ChatListItem = memo(function ChatListItem({
  chat,
  isActive,
  isPinned,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
  onShare,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(chat.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isRenaming) {
      setDraftTitle(chat.title);
    }
  }, [chat.title, isRenaming]);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    setIsRenaming(false);
    if (trimmed && trimmed !== chat.title) {
      onRename(chat.id, trimmed);
    } else {
      setDraftTitle(chat.title);
    }
  };

  const cancelRename = () => {
    setDraftTitle(chat.title);
    setIsRenaming(false);
  };

  return (
    <div
      onClick={() => {
        if (!isRenaming) onSelect(chat.id);
      }}
      className={`group relative flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors md:px-3 ${
        isActive
          ? "bg-slate-800/90 text-slate-100 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-blue-400"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
      }`}
    >
      <div className="min-w-0 flex-1">
        {isRenaming ? (
          <input
            ref={inputRef}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelRename();
              }
            }}
            onBlur={commitRename}
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none ring-1 ring-blue-500/40"
          />
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              {isPinned && <Pin className="h-3 w-3 shrink-0 text-amber-400/90" aria-hidden="true" />}
              <span className="block truncate font-medium">{chat.title}</span>
            </div>
            {chat.messageCount > 0 && (
              <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                {chat.messageCount} message{chat.messageCount === 1 ? "" : "s"}
              </span>
            )}
          </>
        )}
      </div>

      {!isRenaming && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <ChatItemMenu
            isPinned={isPinned}
            onRename={() => setIsRenaming(true)}
            onTogglePin={() => onTogglePin(chat.id)}
            onShare={() => onShare(chat)}
            onDelete={() => onDelete(chat.id)}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chat.id);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
            aria-label={`Delete ${chat.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
});

export default ChatListItem;
