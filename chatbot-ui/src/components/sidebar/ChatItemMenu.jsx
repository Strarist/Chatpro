import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Pin, PinOff, Share2, Trash2 } from "lucide-react";

export default function ChatItemMenu({ isPinned, onRename, onTogglePin, onShare, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const run = (action) => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((open) => !open);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-700/60 hover:text-slate-200"
        aria-label="Chat actions"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-slate-700/60 bg-slate-900/95 py-1 shadow-xl shadow-black/40 backdrop-blur-md">
          <MenuButton icon={Pencil} label="Rename" onClick={() => run(onRename)} />
          <MenuButton
            icon={isPinned ? PinOff : Pin}
            label={isPinned ? "Unpin" : "Pin"}
            onClick={() => run(onTogglePin)}
          />
          <MenuButton icon={Share2} label="Share" onClick={() => run(onShare)} />
          <div className="my-1 border-t border-slate-700/50" />
          <MenuButton
            icon={Trash2}
            label="Delete"
            onClick={() => run(onDelete)}
            className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
          />
        </div>
      )}
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-800/70 ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
