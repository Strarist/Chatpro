import AppLogo from "./AppLogo";
import { MessageSquarePlus, Sparkles } from "lucide-react";

export default function EmptyWorkspace({ onNewChat, onOpenSidebar }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-slate-700/40 bg-slate-900/85 px-3 py-3 backdrop-blur-xl sm:px-5">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-700/60 text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 md:hidden"
          aria-label="Open chats sidebar"
        >
          ≡
        </button>
        <AppLogo />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold tracking-tight text-gray-100">ChatPro</div>
          <div className="truncate text-xs text-slate-400">AI workspace</div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/50 bg-slate-800/40">
            <Sparkles className="h-8 w-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">Start a conversation</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
            Create a new chat from the sidebar or the button below. Your conversations will appear
            on the left once you begin.
          </p>
          <button
            type="button"
            onClick={onNewChat}
            className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-600/70 bg-slate-800/50 px-5 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>
          <p className="mt-6 text-xs text-slate-500">
            Tip: pin important chats from the sidebar menu for quick access.
          </p>
        </div>
      </div>
    </div>
  );
}
