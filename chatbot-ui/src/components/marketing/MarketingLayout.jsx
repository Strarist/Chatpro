import { motion } from "framer-motion";
import MarketingNavbar from "./MarketingNavbar";
import MarketingFooter from "./MarketingFooter";

const orbVariants = {
  animate: {
    y: [0, -30, 0],
    x: [0, 20, 0],
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
  },
};

const orbVariants2 = {
  animate: {
    y: [0, 30, 0],
    x: [0, -25, 0],
    transition: { duration: 10, repeat: Infinity, ease: "easeInOut" },
  },
};

export default function MarketingLayout({ onStartChat, children }) {
  return (
    <div id="top" className="relative min-h-screen w-full overflow-hidden bg-[#0f172a] text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

      <motion.div
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-500 opacity-20 blur-3xl"
        variants={orbVariants}
        animate="animate"
      />
      <motion.div
        className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500 opacity-20 blur-3xl"
        variants={orbVariants2}
        animate="animate"
      />

      <MarketingNavbar onStartChat={onStartChat} />

      <main className="relative z-10">{children}</main>

      <MarketingFooter onStartChat={onStartChat} />
    </div>
  );
}
