import { useState } from "react";
import { Menu, X } from "lucide-react";
import AppLogo from "../AppLogo";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Preview", href: "#preview" },
  { label: "Why ChatPro", href: "#why-chatpro" },
];

const scrollToSection = (href) => {
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export default function MarketingNavbar({ onStartChat }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (href) => {
    setMobileOpen(false);
    scrollToSection(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/40 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => scrollToSection("#top")}
          className="flex min-w-0 items-center gap-2.5 text-left"
        >
          <AppLogo size="sm" />
          <span className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
            ChatPro
          </span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartChat}
            className="hidden rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:from-blue-400 hover:to-indigo-500 sm:inline-flex"
          >
            Start chatting
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/60 text-slate-300 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-700/40 bg-slate-950/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => handleNavClick(link.href)}
                className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onStartChat?.();
              }}
              className="mt-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white"
            >
              Start chatting
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
