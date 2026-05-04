import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const MessageBubble = ({ message, onRegenerate, onEdit }) => {
  const [copied, setCopied] = useState(false);

  if (!message) return null;

  const isUser = message.role === "user";

  // ✅ Copy handler
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
      } group`}
    >
      <div className="max-w-[700px] w-full relative">

        {/* Label */}
        <div
          className={`text-xs text-gray-400 mb-1 px-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {isUser ? "You" : "AI"}
        </div>

        {/* Bubble */}
        <div
          className={`px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-md whitespace-pre-wrap break-words ${
            isUser
              ? "bg-blue-600 text-white ml-auto"
              : "bg-gray-700 text-white"
          }`}
        >
          {isUser ? (
            message.content
          ) : (
            <>
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-3 leading-relaxed">{children}</p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-xl font-semibold mt-4 mb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold mt-4 mb-2">
                      {children}
                    </h2>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc ml-5 space-y-2 mb-3">
                      {children}
                    </ul>
                  ),
                  code({ inline, className, children }) {
                    const match = /language-(\w+)/.exec(className || "");

                    if (!inline && match) {
                      return (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            borderRadius: "0.5rem",
                            padding: "1rem",
                            marginTop: "0.5rem",
                            marginBottom: "0.5rem",
                          }}
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

              {/* Streaming cursor */}
              {message.isStreaming && (
                <span className="inline-block ml-1">
                  <span className="inline-block w-[2px] h-[1em] bg-white animate-pulse align-middle rounded-sm" />
                </span>
              )}
            </>
          )}
        </div>

        {/* ✅ Actions (clean + unified) */}
        {!message.isStreaming && (
          <div className="opacity-0 group-hover:opacity-100 transition absolute -bottom-7 left-2 flex gap-3 text-xs text-gray-300">

            {/* Copy */}
            <button onClick={handleCopy} className="hover:text-white">
              {copied ? "Copied ✓" : "Copy"}
            </button>

            {/* Edit */}
            {isUser && onEdit && (
              <button onClick={onEdit} className="hover:text-white">
                Edit
              </button>
            )}

            {/* Regenerate */}
            {!isUser && onRegenerate && (
              <button onClick={onRegenerate} className="hover:text-white">
                Regenerate
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MessageBubble;