import { motion } from "framer-motion";
import { Zap, MessageSquare, Server, MessageCircle, Radio, Database } from "lucide-react";
import MarketingLayout from "../components/marketing/MarketingLayout";
import HeroPreviewCard from "../components/marketing/HeroPreviewCard";

const TRUST_BADGES = ["Streaming", "Multi-chat", "Markdown", "Privacy-safe"];

const HOW_IT_WORKS = [
  {
    icon: MessageCircle,
    title: "Ask",
    description: "Type a question or pick a starter prompt in your workspace.",
  },
  {
    icon: Radio,
    title: "Stream",
    description: "Watch the assistant reply token-by-token over SSE—no fake typing.",
  },
  {
    icon: Database,
    title: "Persist",
    description: "Chats save locally and sync to the backend when connected.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Real-Time Streaming",
    description:
      "Responses stream token-by-token using SSE for a fast, natural conversational experience.",
  },
  {
    icon: MessageSquare,
    title: "Persistent Multi-Chat",
    description:
      "Create, switch, and preserve multiple conversations with interruption-safe streaming.",
  },
  {
    icon: Server,
    title: "Production-Ready Stack",
    description:
      "React, FastAPI, OpenRouter, privacy isolation, and deployable Vercel + Render architecture.",
  },
];

const scrollToPreview = () => {
  document.querySelector("#preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function LandingPage({ onStartChat }) {
  return (
    <MarketingLayout onStartChat={onStartChat}>
      {/* Hero */}
      <section className="marketing-section">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 backdrop-blur-md">
              <span className="text-sm font-medium text-blue-300">AI workspace for builders</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Real-time AI chat
              </span>
              <br />
              <span className="text-white">built like a product.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-300 lg:mx-0">
              ChatPro combines streaming responses, persistent conversations, and production-grade
              frontend architecture—in one polished demo you can deploy today.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={onStartChat}
                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition-all hover:from-blue-400 hover:to-indigo-500 sm:w-auto"
              >
                Start chatting
              </button>
              <button
                type="button"
                onClick={scrollToPreview}
                className="w-full rounded-lg border border-slate-600/60 bg-slate-800/40 px-8 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800/70 sm:w-auto"
              >
                See how it works
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
              {TRUST_BADGES.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-700/60 bg-slate-900/50 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <HeroPreviewCard />
          </div>
        </div>
      </section>

      {/* Preview */}
      <section id="preview" className="marketing-section bg-slate-900/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Live preview</h2>
            <p className="mt-3 text-slate-300">
              Streaming UX with markdown, code blocks, and multi-chat sidebar—just like a real SaaS
              product.
            </p>
          </div>

          <motion.div
            className="glass-panel overflow-hidden shadow-2xl shadow-blue-500/10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-800/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="font-semibold text-white">ChatPro Live Preview</span>
              </div>
              <span className="text-xs text-blue-300">Streaming in real time</span>
            </div>

            <div className="min-h-56 space-y-4 bg-gradient-to-b from-slate-900/20 to-slate-950/40 p-6">
              <div className="flex justify-end">
                <div className="max-w-xs rounded-2xl rounded-tr-lg bg-gradient-to-br from-blue-500 to-indigo-600 px-4 py-3 text-sm text-white shadow-lg">
                  Summarize quantum computing in simple terms.
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-xs rounded-2xl rounded-tl-lg border border-slate-700/50 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">
                  Quantum computing uses qubits instead of regular bits, allowing computers to
                  process multiple possibilities simultaneously.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="marketing-section">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">How it works</h2>
            <p className="mt-3 text-slate-300">Three steps from question to saved conversation.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="glass-panel p-6 text-center md:text-left">
                  <div className="mx-auto mb-4 inline-flex rounded-lg bg-blue-500/10 p-3 md:mx-0">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
                    Step {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="marketing-section bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div id="why-chatpro" className="mb-12 scroll-mt-24 text-center">
            <div className="mb-4 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2">
              <span className="text-sm font-medium text-blue-300">Why ChatPro</span>
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Built like a real AI product</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Engineering choices that matter for streaming UX, persistence, and portfolio credibility.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="glass-panel group p-8 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="mb-5 inline-flex rounded-lg bg-blue-500/10 p-3 group-hover:bg-blue-500/20">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="marketing-section bg-gradient-to-b from-transparent via-blue-600/5 to-slate-900/30">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Start conversations that feel instant.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Open the workspace, pick a model, and stream your first reply in seconds.
          </p>
          <button
            type="button"
            onClick={onStartChat}
            className="mt-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition-all hover:from-blue-400 hover:to-indigo-500"
          >
            Launch ChatPro
          </button>
        </div>
      </section>
    </MarketingLayout>
  );
}
