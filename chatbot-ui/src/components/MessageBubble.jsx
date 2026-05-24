import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";



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
        // ================= USER =================
        <div className="flex w-full max-w-4xl flex-col items-end gap-2 px-0.5 sm:px-2">

          {/* USER BUBBLE */}
          <div className="max-w-[90%] rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 px-4 py-3 text-[15px] leading-relaxed text-white shadow-lg shadow-blue-950/30 transition-all duration-200 ease-out hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-950/40 sm:max-w-[82%] sm:px-5 md:max-w-[74%] lg:max-w-[72%]">
            {message.content}
          </div>

          {/* ACTIONS BELOW USER BUBBLE */}
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
        // ================= AI =================
        <div className="flex w-full max-w-4xl items-start gap-2 px-0.5 sm:gap-3 sm:px-2">

          {/* AVATAR */}
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white sm:h-8 sm:w-8 sm:text-sm">
            A
          </div>

          {/* MESSAGE + ACTIONS (VERTICAL STACK) */}
          <div className="flex w-full max-w-[90%] flex-col gap-2 sm:max-w-[82%] md:max-w-[74%] lg:max-w-[72%]">

            {/* MESSAGE BUBBLE */}
<div className="w-full overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 py-3 text-[15px] leading-relaxed text-slate-100 shadow-lg shadow-black/30 break-words transition-all duration-200 ease-out hover:border-slate-600/60 hover:bg-slate-800/50 hover:shadow-xl hover:shadow-black/40 backdrop-blur-md sm:px-5">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 leading-relaxed">{children}</p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-xl font-semibold mt-4 mb-2 text-slate-50">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mt-4 mb-2 text-slate-50">{children}</h2>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-50">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc ml-5 space-y-2 mb-3">{children}</ul>
                  ),
                  code({ inline, className, children }) {
                    const match = /language-(\w+)/.exec(className || "");

                    if (!inline && match) {
                      return (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      );
                    }

                    return (
                      <code className="bg-slate-700/60 px-2 py-1 rounded text-sm font-medium">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* STREAM CURSOR */}
              {message.isStreaming && (
                <span className="ml-0.5 inline-block h-[1em] w-[2px] rounded-full bg-blue-300/80 align-[-0.125em] animate-pulse" />
              )}
            </div>

            {/* ACTIONS BELOW */}
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

  {/* Divider */}
  <span className="opacity-30">|</span>

  {/* Copy */}
  <button
    onClick={handleCopy}
    className="rounded-md px-1 transition-all duration-200 ease-out hover:text-gray-200 active:scale-95"
  >
    {copied ? "\u2713 Copied" : "Copy"}
  </button>

  {/* Regenerate */}
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
