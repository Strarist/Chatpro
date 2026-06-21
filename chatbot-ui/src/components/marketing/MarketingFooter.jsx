const FOOTER_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Live preview", href: "#preview" },
  { label: "Why ChatPro", href: "#why-chatpro" },
];

const scrollToSection = (href) => {
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export default function MarketingFooter({ onStartChat }) {
  return (
    <footer className="relative z-10 border-t border-slate-700/50 bg-slate-950/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Product
            </h3>
            <ul className="mt-4 space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.href)}
                    className="text-sm text-slate-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={onStartChat}
                  className="text-sm text-blue-300 transition-colors hover:text-blue-200"
                >
                  Get started
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Built with
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              React · Vite · Tailwind CSS
              <br />
              FastAPI · SQLAlchemy · SSE streaming
              <br />
              OpenRouter · Vercel · Render
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Project
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Free-tier AI via OpenRouter. Privacy-isolated per browser with no account
              required.
            </p>
            <a
              href="https://github.com/Strarist/Chatpro"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-blue-300 transition-colors hover:text-blue-200"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500 sm:text-left">
          © {new Date().getFullYear()} ChatPro. Portfolio AI chat application.
        </div>
      </div>
    </footer>
  );
}
