import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const markdownComponents = {
  p: ({ children }) => (
    <p className="my-3 leading-7 text-slate-100 first:mt-0 last:mb-0">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 text-2xl font-semibold leading-tight text-slate-50 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-3 text-xl font-semibold leading-tight text-slate-50 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-lg font-semibold leading-tight text-slate-100 first:mt-0">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-blue-400/40 bg-slate-900/40 pl-4 py-2 text-slate-300 italic">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => <ul className="my-3 ml-5 list-disc space-y-2 marker:text-slate-400">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-3 ml-5 list-decimal space-y-2 marker:text-slate-400">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-blue-300 underline decoration-blue-400/50 underline-offset-2 transition-colors hover:text-blue-200"
    >
      {children}
    </a>
  ),
  code({ className, children, ...props }) {
    const match = /language-([\w-]+)/.exec(className || "");
    const codeText = String(children).replace(/\n$/, "");
    const isBlock = Boolean(match) || codeText.includes("\n");

    if (isBlock) {
      return (
        <div className="my-4 overflow-hidden rounded-xl border border-slate-700/70 bg-slate-950/90 shadow-[0_0_0_1px_rgba(148,163,184,0.08),0_10px_30px_rgba(2,6,23,0.45)]">
          <div className="overflow-x-auto px-4 py-3">
            <SyntaxHighlighter
              {...props}
              style={oneDark}
              language={match?.[1] || "text"}
              PreTag="div"
              wrapLongLines={false}
              customStyle={{
                margin: 0,
                padding: 0,
                background: "transparent",
                fontSize: "0.86rem",
                lineHeight: "1.55rem",
              }}
              codeTagProps={{
                style: {
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                },
              }}
            >
              {codeText}
            </SyntaxHighlighter>
          </div>
        </div>
      );
    }

    return (
      <code className="rounded-md border border-slate-700/80 bg-slate-900/95 px-1.5 py-0.5 font-mono text-[0.86em] text-slate-100">
        {children}
      </code>
    );
  },
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-sm text-slate-200">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-slate-600/70 bg-slate-900/65">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-700/70">{children}</tbody>,
  tr: ({ children }) => <tr className="transition-colors hover:bg-slate-800/40">{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2 align-top leading-6 text-slate-200">{children}</td>,
  input: ({ type, checked }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={Boolean(checked)}
          readOnly
          className="mr-2 h-4 w-4 cursor-default rounded border-slate-500 bg-slate-900 align-middle accent-blue-500"
        />
      );
    }
    return null;
  },
};

const MessageBubble = ({
  message,
  onEdit,
  onRegenerate,
  versionIndex = 0,
  totalVersions = 1,
  onPrev,
  onNext,
}) => {
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState(null);

  if (!message) return null;

  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <div
      className={`w-full flex ${
        isUser ? "justify-end" : "justify-start"
      } group animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out`}
    >
      {isUser ? (
        <div className="flex w-full max-w-4xl flex-col items-end gap-2 px-0.5 sm:px-2">
          <div className="max-w-[90%] rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 px-4 py-3 text-[15px] leading-relaxed text-white shadow-lg shadow-blue-950/30 transition-all duration-200 ease-out hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-950/40 sm:max-w-[82%] sm:px-5 md:max-w-[74%] lg:max-w-[72%]">
            {message.content}
          </div>

          {!message.isStreaming && (
            <div className="mr-1 flex gap-3 text-xs text-gray-400 opacity-0 transition-all duration-200 ease-out group-hover:opacity-100">
              <button
                onClick={handleCopy}
                className="rounded-md px-1 transition-all duration-200 ease-out hover:text-gray-200 active:scale-95"
              >
                {copied ? "\u2713 Copied" : "Copy"}
              </button>

              {onEdit && (
                <button
                  onClick={onEdit}
                  className="rounded-md px-1 transition-all duration-200 ease-out hover:text-gray-200 active:scale-95"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-full max-w-4xl items-start gap-2 px-0.5 sm:gap-3 sm:px-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white sm:h-8 sm:w-8 sm:text-sm">
            A
          </div>

          <div className="flex w-full max-w-[90%] flex-col gap-2 sm:max-w-[82%] md:max-w-[74%] lg:max-w-[72%]">
            <div className="w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 py-3 text-[15px] text-slate-100 shadow-lg shadow-black/30 break-words transition-all duration-200 ease-out hover:border-slate-600/60 hover:bg-slate-800/50 hover:shadow-xl hover:shadow-black/40 backdrop-blur-md sm:px-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>

              {message.isStreaming && (
                <span className="ml-0.5 inline-block h-[1em] w-[2px] rounded-full bg-blue-300/80 align-[-0.125em] animate-pulse" />
              )}
            </div>

            {!message.isStreaming && (
              <>
                <div className="ml-1 flex items-center gap-3 text-xs text-gray-400 opacity-0 transition-all duration-200 ease-out group-hover:opacity-100">
                  <button
                    onClick={() => setReaction("up")}
                    className={`rounded-md px-1 text-sm transition-all duration-200 ease-out active:scale-95 ${
                      reaction === "up" ? "text-green-400" : "hover:text-gray-200"
                    }`}
                  >
                    {"\u{1F44D}"}
                  </button>

                  <button
                    onClick={() => setReaction("down")}
                    className={`rounded-md px-1 text-sm transition-all duration-200 ease-out active:scale-95 ${
                      reaction === "down" ? "text-red-400" : "hover:text-gray-200"
                    }`}
                  >
                    {"\u{1F44E}"}
                  </button>

                  <span className="opacity-30">|</span>

                  <button
                    onClick={handleCopy}
                    className="rounded-md px-1 transition-all duration-200 ease-out hover:text-gray-200 active:scale-95"
                  >
                    {copied ? "\u2713 Copied" : "Copy"}
                  </button>

                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="rounded-md px-1 transition-all duration-200 ease-out hover:text-gray-200 active:scale-95"
                    >
                      Regenerate
                    </button>
                  )}
                </div>

                {totalVersions > 1 && (
                  <div className="ml-1 flex items-center gap-2 text-xs text-gray-500">
                    <button
                      onClick={onPrev}
                      disabled={versionIndex <= 0}
                      className="rounded-md px-2 py-1 transition-all duration-200 ease-out hover:bg-slate-800 hover:text-gray-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:active:scale-100"
                      aria-label="Previous response version"
                    >
                      {"<"}
                    </button>
                    <span className="tabular-nums text-gray-400">
                      {versionIndex + 1} / {totalVersions}
                    </span>
                    <button
                      onClick={onNext}
                      disabled={versionIndex >= totalVersions - 1}
                      className="rounded-md px-2 py-1 transition-all duration-200 ease-out hover:bg-slate-800 hover:text-gray-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:active:scale-100"
                      aria-label="Next response version"
                    >
                      {">"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
