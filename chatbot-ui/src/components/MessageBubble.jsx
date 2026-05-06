import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";



const MessageBubble = ({
  message,
  onEdit,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);

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

  const [reaction, setReaction] = useState(null);

  return (
    <div
      className={`w-full flex ${
        isUser ? "justify-end" : "justify-start"
      } group animate-in fade-in slide-in-from-bottom-1 duration-200`}
    >
      {isUser ? (
        // ================= USER =================
        <div className="flex items-center gap-3 max-w-[700px] w-full justify-end px-2">

          {/* ACTIONS (LEFT OF USER BUBBLE) */}
          {!message.isStreaming && (
            <div className="text-xs text-gray-400 flex gap-2">
              <button
                onClick={handleCopy}
                className="hover:text-gray-200 transition"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>

              {onEdit && (
                <button
                  onClick={onEdit}
                  className="hover:text-gray-200 transition"
                >
                  Edit
                </button>
              )}
            </div>
          )}

          {/* USER BUBBLE */}
          <div className="max-w-[75%] rounded-[32px] bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 shadow-sm shadow-black/25 text-[15px] leading-relaxed break-words">
            {message.content}
          </div>
        </div>
      ) : (
        // ================= AI =================
        <div className="flex items-start gap-3 max-w-[700px] w-full px-2">

          {/* AVATAR */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white">
            A
          </div>

          {/* MESSAGE + ACTIONS (VERTICAL STACK) */}
          <div className="flex flex-col gap-2 max-w-[75%] w-full">

            {/* MESSAGE BUBBLE */}
<div className="w-full rounded-[28px] bg-[#0f172a] border border-[#1e293b] text-slate-100 px-5 py-3 shadow-sm shadow-black/20 text-[15px] leading-relaxed break-words transition-all duration-200 hover:shadow-md hover:border-[#334155]">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 leading-relaxed">{children}</p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-xl font-semibold mt-4 mb-2">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">{children}</strong>
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
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">
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
                <span className="inline w-[2px] h-[1em] bg-white ml-0.5 animate-pulse" />
              )}
            </div>

            {/* ACTIONS BELOW */}
            {!message.isStreaming && (
              <div className="flex items-center gap-3 text-xs text-gray-400 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-200">



  <button
  onClick={() => setReaction("up")}
  className={`text-sm transition ${
    reaction === "up" ? "text-green-400" : "hover:text-gray-200"
  }`}
>
  👍
</button>

<button
  onClick={() => setReaction("down")}
  className={`text-sm transition ${
    reaction === "down" ? "text-red-400" : "hover:text-gray-200"
  }`}
>
  👎
</button>

  {/* Divider */}
  <span className="opacity-30">|</span>

  {/* Copy */}
  <button
    onClick={handleCopy}
    className="hover:text-gray-200 transition"
  >
    {copied ? "✓ Copied" : "Copy"}
  </button>

  {/* Regenerate */}
  {onRegenerate && (
    <button
      onClick={onRegenerate}
      className="hover:text-gray-200 transition"
    >
      Regenerate
    </button>
  )}

</div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;