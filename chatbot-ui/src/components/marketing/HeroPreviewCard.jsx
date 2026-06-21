import { motion } from "framer-motion";

export default function HeroPreviewCard() {
  return (
    <motion.div
      className="glass-panel w-full overflow-hidden shadow-2xl shadow-blue-500/10"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
    >
      <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-800/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span className="text-sm font-medium text-white">ChatPro</span>
        </div>
        <span className="text-xs text-blue-300">Streaming live</span>
      </div>

      <div className="space-y-3 bg-gradient-to-b from-slate-900/30 to-slate-950/50 p-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-br from-blue-500 to-indigo-600 px-3 py-2 text-sm text-white">
            Explain SSE streaming in one paragraph.
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[90%] rounded-2xl rounded-tl-md border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-sm text-slate-200">
            Server-Sent Events let the server push tokens to your browser as they are
            generated—perfect for real-time AI chat.
            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-blue-300 align-middle" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
