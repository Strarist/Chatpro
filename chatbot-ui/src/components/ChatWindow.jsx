import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import { useEffect, useRef, useState } from "react";
import { streamAIResponse } from "../services/aiService";
import AppLogo from "./AppLogo";

const ChatWindow = ({ messages = [], setMessages }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [input, setInput] = useState("");

  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const activeRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) {
        controllerRef.current.abort();
        finalizeStreamingResponse();
      }
    };
  }, []);

  const finalizeStreamingResponse = () => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastMsg = updated[updated.length - 1];

      if (lastMsg?.role === "assistant" && lastMsg.isStreaming) {
        updated[updated.length - 1] = {
          ...lastMsg,
          isStreaming: false,
        };
      }
      return updated;
    });
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      finalizeStreamingResponse();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);


  // =========================
  // ✅ AUTO SCROLL
  // =========================
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (isNearBottom) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [messages]);

  useEffect(() => {
    if (controllerRef.current && isLoading) {
      controllerRef.current.abort();
      finalizeStreamingResponse();
      setIsLoading(false);
    }
  }, [messages.length > 0 ? messages[0]?.id : null]);

  const [activeVersionMap, setActiveVersionMap] = useState({});

  const generateId = () => {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  };

  // =========================
  // 🚀 SEND MESSAGE
  // =========================
  const sendMessage = async (content) => {
    const trimmedContent = String(content ?? "").trim();
    if (!trimmedContent || isLoading) return;

    if (
      messages.length &&
      messages[messages.length - 1]?.role === "user" &&
      messages[messages.length - 1]?.content === trimmedContent
    ) {
      return;
    }

    controllerRef.current?.abort();
    controllerRef.current = null;

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
  
    let updatedMessages;
    const editIdx = editingIndex;

    // ✅ EDIT & RESEND: drop edited message + everything after, then new user turn
    if (editIdx !== null) {
      const trimmed = messages.slice(0, editIdx);
      const userId = generateId();
      updatedMessages = [
        ...trimmed,
        { id: userId, role: "user", content: content.trim() },
      ];
      setEditingIndex(null);
      setEditingText("");
      setActiveVersionMap({});
    } else {
      const userId = generateId();
      updatedMessages = [
        ...messages,
        { id: userId, role: "user", content: content.trim() },
      ];
    }

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
  
    try {
      controllerRef.current = new AbortController();
  
      // ✅ Add assistant placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "",
          isStreaming: true,
          parentId: updatedMessages[updatedMessages.length - 1]?.id || null,
        },
      ]);
  
      await streamAIResponse(
        updatedMessages,
        (incomingText) => {
          if (
            !isMountedRef.current ||
            requestId !== activeRequestIdRef.current
          ) {
            return;
          }
          setMessages((prev) => {
            const updated = [...prev];
            if (!updated.length) return updated;
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: incomingText,
              isStreaming: true,
            };
            return updated;
          });
        },
        controllerRef.current
      );
  
      // finish streaming
      setMessages((prev) => {
        const updated = [...prev];
        if (!updated.length) return updated;
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
        return updated;
      });
  
    } catch (err) {
      if (err.name === "AbortError") {
        finalizeStreamingResponse();
        return;
      }

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        if (last?.role === "assistant" && last.isStreaming) {
          updated[updated.length - 1] = {
            ...last,
            content: "Something went wrong. Please try again.",
            isStreaming: false,
          };
          return updated;
        }

        return [
          ...updated,
          {
            id: generateId(),
            role: "assistant",
            content: "Something went wrong. Please try again.",
            isStreaming: false,
            parentId: updatedMessages[updatedMessages.length - 1]?.id || null,
          },
        ];
      });
    } finally {
      if (isMountedRef.current && requestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
      if (controllerRef.current?.signal?.aborted || requestId === activeRequestIdRef.current) {
        controllerRef.current = null;
      }
    }
  };

  // =========================
  // 🛑 STOP GENERATION
  // =========================
  const stopGeneration = () => {
    activeRequestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;

    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
      }
      return updated;
    });

    setIsLoading(false);
  };

  // =========================
  // ✏️ START EDIT
  // =========================
  const handleEdit = (index, text) => {
    setEditingIndex(index);
    setEditingText(text ?? "");
  };

  // =========================
  // 🔄 REGENERATE
  // =========================
  const regenerateResponse = async () => {
    if (isLoading) return;
  
    controllerRef.current?.abort();
  
    // ✅ DO NOT remove old assistant messages
    const baseMessages = [...messages];
  
    // find last user message
    const lastUserIndex = [...baseMessages]
      .reverse()
      .findIndex((m) => m.role === "user");
  
    if (lastUserIndex === -1) return;
  
    const realIndex = baseMessages.length - 1 - lastUserIndex;
    const lastUser = baseMessages[realIndex];
  
    setIsLoading(true);
  
    try {
      controllerRef.current = new AbortController();
  
      // ✅ Create NEW assistant message (branch)
      const newAssistantId = generateId();
      const parentKey =
        lastUser.id != null ? lastUser.id : `__user_slot_${realIndex}`;

      setMessages((prev) => [
        ...prev,
        {
          id: newAssistantId,
          role: "assistant",
          content: "",
          isStreaming: true,
          parentId: parentKey,
        },
      ]);

      setActiveVersionMap((prev) => ({
        ...prev,
        [parentKey]: newAssistantId,
      }));
  
      await streamAIResponse(
        baseMessages,
        (incomingText) => {
          setMessages((prev) => {
            const updated = [...prev];
  
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: incomingText,
              isStreaming: true,
            };
  
            return updated;
          });
        },
        controllerRef.current
      );
  
      // finish streaming
      setMessages((prev) => {
        const updated = [...prev];
        if (!updated.length) return updated;

        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            isStreaming: false,
          };
        }

        return updated;
      });


    } catch (err) {
      if (err.name === "AbortError") {
        finalizeStreamingResponse();
      } else {
        console.error("Regeneration failed:", err);
      }
    } finally {
      controllerRef.current = null;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const getAssistantParentKey = (msg, index, sourceMessages = messages) => {
    if (msg.role !== "assistant") return null;
    if (msg.parentId) return msg.parentId;

    for (let i = index - 1; i >= 0; i--) {
      if (sourceMessages[i]?.role === "user") {
        return sourceMessages[i].id ?? `__user_slot_${i}`;
      }
    }

    return null;
  };

  const getVersions = (messages) => {
    const map = {};
  
    messages.forEach((msg, index) => {
      const parentKey = getAssistantParentKey(msg, index, messages);

      if (parentKey) {
        if (!map[parentKey]) {
          map[parentKey] = [];
        }
        map[parentKey].push(msg);
      }
    });
  
    return map;
  };
  
  const versionMap = getVersions(messages);
  const latestAssistantIndex = messages.reduce(
    (latest, msg, index) => (msg.role === "assistant" ? index : latest),
    -1
  );
  const latestAssistantParentKey =
    latestAssistantIndex >= 0
      ? getAssistantParentKey(messages[latestAssistantIndex], latestAssistantIndex)
      : null;
  const canRegenerate = (msg, index) => {
    const parentKey = getAssistantParentKey(msg, index);
    return parentKey
      ? parentKey === latestAssistantParentKey
      : index === latestAssistantIndex;
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-[#020617] text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-[#1e293b] bg-[#020617]/80 px-3 py-3 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <AppLogo />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold tracking-[-0.01em] text-gray-100">ChatPro</div>
            <div className="truncate text-xs text-gray-500">AI Assistant</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2" />
      </header>

      {/* Messages */}
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-semibold text-gray-200">ChatPro</div>
            <div className="mt-2 text-sm text-gray-400">
              Ask anything. Start a conversation.
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3.5 overflow-y-auto px-2.5 py-4 sm:gap-4 sm:px-5 sm:py-5 md:px-8 lg:px-10"
        >
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <MessageBubble
                  key={msg.id ?? `user-${i}`}
                  message={msg}
                  onEdit={() => handleEdit(i, msg.content)}
                />
              );
            }

            // Assistant: no parentId → show as-is (legacy / welcome / error bubbles)
            const parentKey = getAssistantParentKey(msg, i);

            // Assistant without a user parent: show as-is (welcome / error bubbles)
            if (!parentKey) {
              return (
                <MessageBubble
                  key={msg.id ?? `assistant-${i}`}
                  message={msg}
                  onRegenerate={canRegenerate(msg, i) ? regenerateResponse : undefined}
                  versionIndex={0}
                  totalVersions={1}
                />
              );
            }

            const siblings = versionMap[parentKey] || [];
            if (!siblings.length) {
              return (
                <MessageBubble
                  key={msg.id ?? `assistant-${i}`}
                  message={msg}
                  onRegenerate={canRegenerate(msg, i) ? regenerateResponse : undefined}
                  versionIndex={0}
                  totalVersions={1}
                />
              );
            }

            const latest = siblings[siblings.length - 1];
            const mappedId = activeVersionMap[parentKey];
            const activeId =
              mappedId && siblings.some((s) => s.id === mappedId)
                ? mappedId
                : latest?.id;
            if (!activeId || msg.id !== activeId) return null;

            const currentIndex = Math.max(
              0,
              siblings.findIndex((s) => s.id === activeId)
            );

            return (
              <MessageBubble
                key={msg.id ?? `assistant-${i}`}
                message={msg}
                onRegenerate={canRegenerate(msg, i) ? regenerateResponse : undefined}
                versionIndex={currentIndex}
                totalVersions={siblings.length}
                onPrev={() => {
                  if (currentIndex > 0) {
                    setActiveVersionMap((prev) => ({
                      ...prev,
                      [parentKey]: siblings[currentIndex - 1].id,
                    }));
                  }
                }}
                onNext={() => {
                  if (currentIndex < siblings.length - 1) {
                    setActiveVersionMap((prev) => ({
                      ...prev,
                      [parentKey]: siblings[currentIndex + 1].id,
                    }));
                  }
                }}
              />
            );
          })}

        {/* Typing Indicator */}
        {isLoading && !messages.some(msg => msg.role === "assistant" && msg.isStreaming) && (
          <div className="group flex w-full justify-start animate-in fade-in slide-in-from-bottom-3 duration-200 ease-out">
            <div className="relative w-full max-w-4xl px-1 sm:px-2">
              <div className="text-[11px] tracking-[0.18em] uppercase mb-2 px-1 text-left text-slate-400">
                AI
              </div>
              <div className="max-w-[90%] rounded-[24px] border border-[#1e293b] bg-[#0f172a] px-4 py-4 text-slate-100 shadow-sm shadow-black/20 transition-all duration-200 ease-out sm:max-w-[82%] sm:px-5 md:max-w-[74%] lg:max-w-[72%]">
                <div className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-400/80 animate-pulse" style={{ animationDelay: "0s" }} />
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-400/70 animate-pulse" style={{ animationDelay: "0.12s" }} />
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-400/60 animate-pulse" style={{ animationDelay: "0.24s" }} />
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Input */}
      <div className="mx-auto w-full max-w-4xl px-2.5 pb-3 sm:px-5 sm:pb-5 md:px-8 md:pb-6 lg:px-10">
      <InputBox
        value={editingIndex !== null ? editingText : input}
        setValue={(val) => {
          if (editingIndex !== null) setEditingText(val);
          else setInput(val);
        }}
        onSend={sendMessage}
        onStop={stopGeneration}
        isLoading={isLoading}
      />
      </div>
    </div>
  );
};

export default ChatWindow;

