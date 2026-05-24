import { motion } from "framer-motion";
import { Zap, MessageSquare, Clock } from "lucide-react";

export default function LandingPage({ onStartChatting }) {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const featureCards = [
    {
      icon: Zap,
      title: "Real-Time Streaming",
      description: "Watch AI responses appear in real-time with smooth streaming.",
    },
    {
      icon: MessageSquare,
      title: "Multi-Chat History",
      description: "Organize and manage multiple conversations effortlessly.",
    },
    {
      icon: Clock,
      title: "Production Deployment",
      description: "Built for scale with enterprise-grade reliability.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0f172a] text-white">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600 opacity-20 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-purple-600 opacity-20 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
        {/* Hero Section */}
        <motion.div
          className="max-w-3xl text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.div
            className="mb-8 inline-block"
            variants={fadeInUp}
          >
            <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 backdrop-blur-md">
              <span className="text-sm font-medium text-blue-300">
                ✨ AI-Powered Assistant
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="mb-6 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl"
            variants={fadeInUp}
          >
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">
              AI Conversations,
            </span>
            <br />
            <span className="text-white">Reimagined.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="mb-12 text-xl text-slate-300 md:text-2xl"
            variants={fadeInUp}
          >
            A production-grade chatbot with real-time streaming responses.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col gap-4 sm:flex-row sm:justify-center"
            variants={fadeInUp}
          >
            <button
              onClick={onStartChatting}
              className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/50 hover:shadow-xl"
            >
              Start Chatting
            </button>
            <a
              href="https://github.com/Strarist/Realtime-Chatbot"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-600 bg-slate-700/30 px-8 py-3 font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-slate-400 hover:bg-slate-600/50"
            >
              View Source
            </a>
          </motion.div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="mt-20 grid w-full max-w-4xl gap-6 md:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {featureCards.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 backdrop-blur-md transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-800/50"
                variants={fadeInUp}
                whileHover={{ y: -5 }}
              >
                <div className="mb-4 inline-flex rounded-lg bg-blue-500/10 p-3">
                  <Icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer Text */}
        <motion.p
          className="mt-20 text-center text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Built with React, Vite, and OpenRouter
        </motion.p>
      </div>
    </div>
  );
}
