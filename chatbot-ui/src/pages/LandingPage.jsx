import { motion } from "framer-motion";

export default function LandingPage({ onStartChat }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const headlineVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: "easeOut",
        delay: 0.2,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.5,
      },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 },
    },
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.8,
      },
    },
  };

  const orbVariants = {
    animate: {
      y: [0, -30, 0],
      x: [0, 20, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const orbVariants2 = {
    animate: {
      y: [0, 30, 0],
      x: [0, -25, 0],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const orbVariants3 = {
    animate: {
      y: [0, -20, 0],
      x: [0, 15, 0],
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1,
      },
    },
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0f172a] text-white">
      {/* Static gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

      {/* Animated floating orbs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"
        variants={orbVariants}
        animate="animate"
      />

      <motion.div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20"
        variants={orbVariants2}
        animate="animate"
      />

      <motion.div
        className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-500 rounded-full blur-3xl opacity-15"
        variants={orbVariants3}
        animate="animate"
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Section */}
        <div className="w-full max-w-2xl space-y-8 text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 backdrop-blur-md"
            variants={badgeVariants}
          >
            <span className="mr-2 text-xl">✨</span>
            <span className="text-sm font-medium text-blue-300">AI-Powered Assistant</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight"
            variants={headlineVariants}
          >
            <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
              AI Conversations,
            </span>
            <br />
            <span className="text-white">Reimagined.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-lg sm:text-xl text-slate-300 max-w-lg mx-auto leading-relaxed"
            variants={itemVariants}
          >
            A production-grade chatbot with real-time streaming responses.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            className="flex justify-center pt-6"
            variants={buttonVariants}
            whileHover="hover"
          >
            <motion.button
              onClick={onStartChat}
              className="relative px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white shadow-lg shadow-blue-500/50 hover:shadow-blue-400/70 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Chatting
            </motion.button>
          </motion.div>
        </div>

        {/* Glassmorphism Feature Card */}
        <motion.div
          className="mt-20 w-full max-w-2xl"
          variants={panelVariants}
        >
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-8 backdrop-blur-lg shadow-2xl">
            <p className="text-center text-sm text-slate-400">
              Built with modern web technologies • Real-time streaming • Production-ready
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
