import { motion } from "framer-motion";
import { Zap, MessageSquare, Server } from "lucide-react";

export default function LandingPage({ onStartChat }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, y: -15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const headlineVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        delay: 0.1,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.4,
      },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 },
    },
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        delay: 0.6,
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

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
  };

  const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      y: -8,
      transition: { duration: 0.3 },
    },
  };

  const features = [
    {
      icon: Zap,
      title: "Real-Time Streaming",
      description:
        "Responses stream token-by-token using SSE for a fast and natural conversational experience.",
    },
    {
      icon: MessageSquare,
      title: "Persistent Multi-Chat",
      description:
        "Create, switch, and preserve multiple conversations with local persistence and interruption-safe streaming.",
    },
    {
      icon: Server,
      title: "Production-Ready Stack",
      description:
        "Built with React, FastAPI, OpenRouter, Vercel, and Render using a scalable frontend/backend architecture.",
    },
  ];

  const previewCardVariants = {
    hidden: { opacity: 0, y: 40 },
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

  const previewFloatVariants = {
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const typingDotVariants = {
    animate: {
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1.4,
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0f172a] text-white">
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

      {/* === HERO SECTION === */}
      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="w-full max-w-2xl space-y-6 text-center">
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
            className="flex justify-center pt-4"
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
        <motion.div className="mt-12 w-full max-w-2xl" variants={panelVariants}>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-8 backdrop-blur-lg shadow-2xl">
            <p className="text-center text-sm text-slate-400">
              Built with modern web technologies • Real-time streaming • Production-ready
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* === CHAT PREVIEW MOCKUP SECTION === */}
      <motion.section
        className="relative z-10 py-20 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.3 }}
        variants={sectionVariants}
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent pointer-events-none" />

        <motion.div
          className="relative z-10 max-w-3xl mx-auto"
          variants={previewCardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.4 }}
        >
          <motion.div
            className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-slate-800/40 to-slate-900/40 overflow-hidden shadow-2xl shadow-blue-500/10 backdrop-blur-xl"
            animate="animate"
            variants={previewFloatVariants}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold text-white">ChatPro Live Preview</span>
              </div>
              <span className="text-xs text-blue-300">Streaming in real time</span>
            </div>

            {/* Chat Messages */}
            <div className="p-6 space-y-4 min-h-64 bg-gradient-to-b from-slate-900/20 to-slate-950/40">
              {/* User Message */}
              <div className="flex justify-end">
                <div className="max-w-xs bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl rounded-tr-lg px-4 py-3 text-white text-sm shadow-lg">
                  Summarize quantum computing in simple terms.
                </div>
              </div>

              {/* AI Message with streaming animation */}
              <div className="flex justify-start">
                <motion.div
                  className="max-w-xs bg-slate-800/60 rounded-2xl rounded-tl-lg px-4 py-3 text-slate-200 text-sm border border-slate-700/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <div className="space-y-2">
                    {/* Streaming text reveal */}
                    <motion.span
                      className="inline"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      Quantum computing uses qubits instead of regular bits, allowing computers to
                      process multiple possibilities simultaneously.
                    </motion.span>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.9 }}
                    >
                      <span>
                        {" "}
                        This makes certain complex calculations dramatically faster than traditional
                        computing.
                      </span>
                    </motion.div>

                    {/* Typing indicator */}
                    <motion.div
                      className="flex gap-1 pt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                    >
                      <motion.span
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        variants={typingDotVariants}
                        animate="animate"
                      />
                      <motion.span
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        variants={typingDotVariants}
                        animate="animate"
                        transition={{ delay: 0.2 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        variants={typingDotVariants}
                        animate="animate"
                        transition={{ delay: 0.4 }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* === WHY CHATPRO SECTION === */}
      <motion.section
        className="relative z-10 py-16 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.4 }}
        variants={sectionVariants}
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <motion.div
              className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 backdrop-blur-md mb-4"
              variants={badgeVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.5 }}
            >
              <span className="text-sm font-medium text-blue-300">Why ChatPro</span>
            </motion.div>

            <motion.h2
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-6"
              variants={headlineVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.5 }}
            >
              <span className="text-white">Built Like a Real AI Product.</span>
            </motion.h2>

            <motion.p
              className="text-lg text-slate-300 max-w-2xl mx-auto"
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.5 }}
            >
              ChatPro focuses on real-time AI streaming, persistent multi-chat workflows,
              production-grade architecture, and a smooth user experience.
            </motion.p>
          </div>

          {/* Feature Cards Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="group relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/40 p-8 backdrop-blur-lg transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
                  variants={cardVariants}
                  whileHover="hover"
                >
                  {/* Card glow on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 pointer-events-none" />

                  {/* Icon */}
                  <div className="relative z-10 mb-6 inline-flex rounded-lg bg-blue-500/10 p-3 group-hover:bg-blue-500/20 transition-all duration-300">
                    <Icon className="h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* === FINAL CTA SECTION === */}
      <motion.section
        className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/0 via-blue-600/5 to-slate-900/20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.4 }}
        variants={sectionVariants}
      >
        {/* Decorative orb */}
        <motion.div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-10"
          animate={{
            y: [0, -20, 0],
            transition: {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 backdrop-blur-md mb-6"
            variants={badgeVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
          >
            <span className="text-sm font-medium text-blue-300">Ready to Experience It?</span>
          </motion.div>

          {/* Heading */}
          <motion.h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white"
            variants={headlineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
          >
            Start Conversations That Feel Instant.
          </motion.h2>

          {/* Supporting text */}
          <motion.p
            className="text-lg text-slate-300 max-w-2xl mx-auto mb-8"
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
          >
            Built for real-time AI interaction with smooth streaming, persistent chats, and
            production-grade responsiveness.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={buttonVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
            whileHover="hover"
          >
            <motion.button
              onClick={onStartChat}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white shadow-lg shadow-blue-500/50 hover:shadow-blue-400/70 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Launch ChatPro
            </motion.button>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
