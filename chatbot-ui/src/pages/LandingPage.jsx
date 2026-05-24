export default function LandingPage({ onStartChat }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0f172a] text-white">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />

      {/* Subtle gradient orbs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl opacity-20" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="w-full max-w-2xl space-y-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/50 px-4 py-2 backdrop-blur-sm">
            <span className="mr-2 text-xl">✨</span>
            <span className="text-sm font-medium text-slate-300">AI-Powered Assistant</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
              AI Conversations,
            </span>
            <br />
            <span>Reimagined.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
            A production-grade chatbot with real-time streaming responses.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <button
              onClick={onStartChat}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg font-semibold text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              Start Chatting
            </button>
            <a
              href="https://github.com/Strarist/Realtime-Chatbot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-slate-600 rounded-lg font-semibold text-white hover:bg-slate-800/50 transition-all duration-200 backdrop-blur-sm"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Glassmorphism Feature Card */}
        <div className="mt-20 w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-8 backdrop-blur-md">
            <p className="text-center text-sm text-slate-400">
              Built with modern web technologies • Real-time streaming • Production-ready
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
