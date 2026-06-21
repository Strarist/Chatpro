import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { streamAIResponse } from "../services/aiService";
import { appendMessageToConversation } from "../services/conversationService";
import { useModelSelection } from "../hooks/useModelSelection";
import { getModel } from "../config/models";
import { useMarkdownProcessor } from "../utils/markdownProcessor";
import { createStreamSessionId, isActiveStreamSession as checkActiveStreamSession } from "../utils/streamSession";
import AppLogo from "./AppLogo";
import { Sparkles, Code2, FileText, Bug } from "lucide-react";

const STARTER_PROMPTS = [
  {
    text: "Explain async/await like I'm interviewing tomorrow",
    icon: Sparkles,
  },
  {
    text: "Write a Python function to merge two sorted lists",
    icon: Code2,
  },
  {
    text: "What makes a good portfolio project README?",
    icon: FileText,
  },
  {
    text: "Help me debug a React useEffect that runs twice",
    icon: Bug,
  },
];

const AUTO_SCROLL_THRESHOLD = 150;
const IS_DEV = import.meta.env.DEV;

const generateMessageId = () =>
  "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
const STREAM_STATUS = Object.freeze({
  IDLE: "idle",
  STARTING: "starting",
  STREAMING: "streaming",
  FINALIZING: "finalizing",
  COMPLETED: "completed",
  ABORTED: "aborted",
  ERROR: "error",
});

const ChatWindow = ({
  messages = [],
  conversationId,
  chatTitle = "New Chat",
  setMessages,
  onOpenSidebar,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [input, setInput] = useState("");
  const [activeVersionMap, setActiveVersionMap] = useState({});
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [streamStatus, setStreamStatus] = useState(STREAM_STATUS.IDLE);
  const [, setDevStreamMetrics] = useState(null);
  const [markdownMetaByMessageId, setMarkdownMetaByMessageId] = useState({});

  // Model selection
  const { selectedModelKey, handleModelChange } = useModelSelection();

  // Markdown processor
  const { processMarkdown } = useMarkdownProcessor();

  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const activeRequestIdRef = useRef(0);
  const streamSessionRef = useRef(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const shouldAutoScrollRef = useRef(true);
  const forceAutoScrollRef = useRef(false);
  const finalizeStreamingResponseRef = useRef(() => {});
  const previousFirstMessageIdRef = useRef(null);
  const orphanLoadingTimerRef = useRef(null);
  const devInvariantKeysRef = useRef(new Set());
  const streamPerfRef = useRef({
    requestId: null,
    sessionId: null,
    mode: "send",
    startedAt: null,
    firstTokenAt: null,
    finalizeStartedAt: null,
    latestContentLength: 0,
  });

  const now = useCallback(() => {
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
      return performance.now();
    }
    return Date.now();
  }, []);

  const devInvariant = useCallback((key, message, context) => {
    if (!IS_DEV) return;
    if (devInvariantKeysRef.current.has(key)) return;
    devInvariantKeysRef.current.add(key);
    console.warn(`[stream-invariant] ${message}`, context ?? {});
  }, []);

  const beginStreamMetrics = useCallback(
    (requestId, sessionId, mode) => {
      streamPerfRef.current = {
        requestId,
        sessionId,
        mode,
        startedAt: now(),
        firstTokenAt: null,
        finalizeStartedAt: null,
        latestContentLength: 0,
      };
      if (IS_DEV) {
        setDevStreamMetrics(null);
      }
    },
    [now]
  );

  const markFirstToken = useCallback(
    (incomingText) => {
      const metrics = streamPerfRef.current;
      metrics.latestContentLength = incomingText.length;
      if (metrics.firstTokenAt === null && incomingText.length > 0) {
        metrics.firstTokenAt = now();
        setStreamStatus(STREAM_STATUS.STREAMING);
      }
    },
    [now]
  );

  const markFinalizing = useCallback(() => {
    const metrics = streamPerfRef.current;
    if (metrics.finalizeStartedAt !== null) {
      devInvariant("duplicate-finalize", "Duplicate finalize transition prevented", {
        requestId: metrics.requestId,
        sessionId: metrics.sessionId,
      });
      return;
    }
    metrics.finalizeStartedAt = now();
    setStreamStatus(STREAM_STATUS.FINALIZING);
  }, [devInvariant, now]);

  const publishDevMetrics = useCallback(
    (status) => {
      if (!IS_DEV) return;
      const metrics = streamPerfRef.current;
      if (metrics.startedAt === null) return;

      const finishedAt = now();
      const ttftMs =
        metrics.firstTokenAt !== null ? metrics.firstTokenAt - metrics.startedAt : null;
      const durationMs = finishedAt - metrics.startedAt;
      const activeStreamMs =
        metrics.firstTokenAt !== null ? Math.max(finishedAt - metrics.firstTokenAt, 1) : 1;
      const throughputPerSec =
        metrics.latestContentLength > 0
          ? (metrics.latestContentLength / (activeStreamMs / 1000)).toFixed(1)
          : "0.0";
      const finalizeMs =
        metrics.finalizeStartedAt !== null ? finishedAt - metrics.finalizeStartedAt : null;

      setDevStreamMetrics({
        mode: metrics.mode,
        requestId: metrics.requestId,
        status,
        chars: metrics.latestContentLength,
        ttftMs,
        durationMs,
        finalizeMs,
        throughputPerSec,
      });
    },
    [now]
  );

  const isNearBottom = useCallback((el, threshold = AUTO_SCROLL_THRESHOLD) => {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    shouldAutoScrollRef.current = true;
  }, []);

  const createStreamSessionIdLocal = useCallback(() => createStreamSessionId(), []);

  const beginStreamSession = useCallback(() => {
    const sessionId = createStreamSessionIdLocal();
    streamSessionRef.current = sessionId;
    return sessionId;
  }, [createStreamSessionIdLocal]);

  const invalidateStreamSession = useCallback(() => {
    streamSessionRef.current = null;
  }, []);

  const isActiveStreamSession = useCallback((requestId, sessionId) => {
    return checkActiveStreamSession(
      requestId,
      sessionId,
      activeRequestIdRef.current,
      streamSessionRef.current,
      isMountedRef.current
    );
  }, []);

  const persistExchange = useCallback((convId, userContent, assistantContent) => {
    if (!convId || !userContent?.trim() || !assistantContent?.trim()) return;

    appendMessageToConversation(convId, "user", userContent.trim()).catch(() => {});
    appendMessageToConversation(convId, "assistant", assistantContent.trim()).catch(() => {});
  }, []);

  const persistAssistantMessage = useCallback((convId, assistantContent) => {
    if (!convId || !assistantContent?.trim()) return;
    appendMessageToConversation(convId, "assistant", assistantContent.trim()).catch(() => {});
  }, []);

  const finalizeStreamingResponse = useCallback(() => {
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
  }, [setMessages]);

  const transitionToStatus = useCallback((status) => {
    setStreamStatus((prev) => (prev === status ? prev : status));
  }, []);

  useEffect(() => {
    finalizeStreamingResponseRef.current = finalizeStreamingResponse;
  }, [finalizeStreamingResponse]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (!IS_DEV) return;

    if (!isLoading) {
      if (orphanLoadingTimerRef.current) {
        clearTimeout(orphanLoadingTimerRef.current);
        orphanLoadingTimerRef.current = null;
      }
      return;
    }

    orphanLoadingTimerRef.current = setTimeout(() => {
      if (isLoadingRef.current && !controllerRef.current) {
        devInvariant("orphan-loading", "Loading state active without an attached stream controller", {
          streamStatus,
          requestId: activeRequestIdRef.current,
        });
      }
    }, 2000);

    return () => {
      if (orphanLoadingTimerRef.current) {
        clearTimeout(orphanLoadingTimerRef.current);
        orphanLoadingTimerRef.current = null;
      }
    };
  }, [devInvariant, isLoading, streamStatus]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (controllerRef.current) {
        invalidateStreamSession();
        controllerRef.current.abort();
        finalizeStreamingResponseRef.current();
        transitionToStatus(STREAM_STATUS.ABORTED);
        publishDevMetrics(STREAM_STATUS.ABORTED);
      }
    };
  }, [invalidateStreamSession, publishDevMetrics, transitionToStatus]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (controllerRef.current) {
        invalidateStreamSession();
        controllerRef.current.abort();
        transitionToStatus(STREAM_STATUS.ABORTED);
      }
      finalizeStreamingResponseRef.current();
      publishDevMetrics(STREAM_STATUS.ABORTED);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [invalidateStreamSession, publishDevMetrics, transitionToStatus]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const shouldScroll =
      forceAutoScrollRef.current || shouldAutoScrollRef.current || isNearBottom(el);

    if (shouldScroll) {
      const behavior = forceAutoScrollRef.current ? "smooth" : "auto";
      requestAnimationFrame(() => {
        scrollToBottom(behavior);
        setShowJumpToLatest(false);
      });
      forceAutoScrollRef.current = false;
      return;
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === "assistant") {
      setShowJumpToLatest(true);
    }
  }, [isNearBottom, messages, scrollToBottom]);

  const hasMessages = messages.length > 0;
  useEffect(() => {
    if (!hasMessages) {
      setShowJumpToLatest(false);
      shouldAutoScrollRef.current = true;
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const nearBottom = isNearBottom(el);
      shouldAutoScrollRef.current = nearBottom;
      if (nearBottom) {
        setShowJumpToLatest(false);
      }
    };

    handleScroll();
    el.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [hasMessages, isNearBottom]);

  const firstMessageId = hasMessages ? messages[0]?.id : null;
  useEffect(() => {
    if (previousFirstMessageIdRef.current === null) {
      previousFirstMessageIdRef.current = firstMessageId;
      return;
    }

    const chatChanged = previousFirstMessageIdRef.current !== firstMessageId;
    previousFirstMessageIdRef.current = firstMessageId;

    if (chatChanged && controllerRef.current && isLoadingRef.current) {
      invalidateStreamSession();
      controllerRef.current.abort();
      finalizeStreamingResponseRef.current();
      setIsLoading(false);
      isLoadingRef.current = false;
      transitionToStatus(STREAM_STATUS.ABORTED);
      publishDevMetrics(STREAM_STATUS.ABORTED);
    }
  }, [firstMessageId, invalidateStreamSession, publishDevMetrics, transitionToStatus]);

  // =========================
  // 🔧 MARKDOWN PROCESSING
  // =========================
  // Process large finalized messages in worker to extract metadata
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (
      !lastMessage ||
      lastMessage.role !== "assistant" ||
      lastMessage.isStreaming ||
      lastMessage.content.length < 2000
    ) {
      return;
    }

    processMarkdown(lastMessage.content)
      .then(({ metadata }) => {
        if (!metadata) return;
        setMarkdownMetaByMessageId((prev) => ({
          ...prev,
          [lastMessage.id]: metadata,
        }));
      })
      .catch(() => {});
  }, [messages, processMarkdown]);

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
    invalidateStreamSession();
    controllerRef.current = null;
    forceAutoScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    setShowJumpToLatest(false);

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    const streamSessionId = beginStreamSession();
    let terminalStatus = STREAM_STATUS.COMPLETED;
    transitionToStatus(STREAM_STATUS.STARTING);
    beginStreamMetrics(requestId, streamSessionId, "send");
    devInvariantKeysRef.current.clear();

    let updatedMessages;
    const editIdx = editingIndex;

    if (editIdx !== null) {
      const trimmed = messages.slice(0, editIdx);
      const userId = generateMessageId();
      updatedMessages = [...trimmed, { id: userId, role: "user", content: content.trim() }];
      setEditingIndex(null);
      setEditingText("");
      setActiveVersionMap({});
    } else {
      const userId = generateMessageId();
      updatedMessages = [...messages, { id: userId, role: "user", content: content.trim() }];
    }

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    isLoadingRef.current = true;

    try {
      controllerRef.current = new AbortController();

      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "assistant",
          content: "",
          isStreaming: true,
          parentId: updatedMessages[updatedMessages.length - 1]?.id || null,
        },
      ]);

      const finalText = await streamAIResponse(
        updatedMessages,
        (incomingText) => {
          if (!isActiveStreamSession(requestId, streamSessionId)) {
            devInvariant("stale-write-send", "Ignored stale token write in send flow", {
              requestId,
              sessionId: streamSessionId,
            });
            return;
          }
          markFirstToken(incomingText);
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
        controllerRef.current,
        getModel(selectedModelKey).id,
        conversationId
      );

      if (!isActiveStreamSession(requestId, streamSessionId)) {
        devInvariant("stale-finalize-send", "Skipped finalize for stale send session", {
          requestId,
          sessionId: streamSessionId,
        });
        return;
      }

      markFinalizing();
      setMessages((prev) => {
        const updated = [...prev];
        if (!updated.length) return updated;
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
        return updated;
      });

      const userContent = updatedMessages[updatedMessages.length - 1]?.content;
      persistExchange(conversationId, userContent, finalText);
    } catch (err) {
      if (err.name === "AbortError") {
        terminalStatus = STREAM_STATUS.ABORTED;
        if (isActiveStreamSession(requestId, streamSessionId)) {
          finalizeStreamingResponse();
          transitionToStatus(STREAM_STATUS.ABORTED);
        } else {
          devInvariant("abort-after-ownership-send", "Abort occurred after ownership changed", {
            requestId,
            sessionId: streamSessionId,
          });
        }
        return;
      }

      if (!isActiveStreamSession(requestId, streamSessionId)) {
        devInvariant("stale-error-send", "Ignored stale error write in send flow", {
          requestId,
          sessionId: streamSessionId,
        });
        return;
      }

      transitionToStatus(STREAM_STATUS.ERROR);
      terminalStatus = STREAM_STATUS.ERROR;
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
            id: generateMessageId(),
            role: "assistant",
            content: "Something went wrong. Please try again.",
            isStreaming: false,
            parentId: updatedMessages[updatedMessages.length - 1]?.id || null,
          },
        ];
      });
    } finally {
      if (isActiveStreamSession(requestId, streamSessionId)) {
        setIsLoading(false);
        isLoadingRef.current = false;
        controllerRef.current = null;
        invalidateStreamSession();
        transitionToStatus(terminalStatus);
        publishDevMetrics(terminalStatus);
      }
    }
  };

  const stopGeneration = () => {
    activeRequestIdRef.current += 1;
    invalidateStreamSession();
    controllerRef.current?.abort();
    controllerRef.current = null;
    transitionToStatus(STREAM_STATUS.ABORTED);
    publishDevMetrics(STREAM_STATUS.ABORTED);

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
    isLoadingRef.current = false;
  };

  const handleEdit = (index, text) => {
    setEditingIndex(index);
    setEditingText(text ?? "");
  };

  const regenerateResponse = async () => {
    if (isLoading) return;

    invalidateStreamSession();
    controllerRef.current?.abort();
    controllerRef.current = null;
    forceAutoScrollRef.current = true;
    shouldAutoScrollRef.current = true;
    setShowJumpToLatest(false);

    const baseMessages = [...messages];
    const lastUserIndex = [...baseMessages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    const streamSessionId = beginStreamSession();
    let terminalStatus = STREAM_STATUS.COMPLETED;
    transitionToStatus(STREAM_STATUS.STARTING);
    beginStreamMetrics(requestId, streamSessionId, "regenerate");
    devInvariantKeysRef.current.clear();

    const realIndex = baseMessages.length - 1 - lastUserIndex;
    const lastUser = baseMessages[realIndex];

    setIsLoading(true);
    isLoadingRef.current = true;

    try {
      controllerRef.current = new AbortController();

      const newAssistantId = generateMessageId();
      const parentKey = lastUser.id != null ? lastUser.id : `__user_slot_${realIndex}`;

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

      const finalText = await streamAIResponse(
        baseMessages,
        (incomingText) => {
          if (!isActiveStreamSession(requestId, streamSessionId)) {
            devInvariant("stale-write-regen", "Ignored stale token write in regenerate flow", {
              requestId,
              sessionId: streamSessionId,
            });
            return;
          }
          markFirstToken(incomingText);
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
        controllerRef.current,
        getModel(selectedModelKey).id,
        conversationId
      );

      if (!isActiveStreamSession(requestId, streamSessionId)) {
        devInvariant("stale-finalize-regen", "Skipped finalize for stale regenerate session", {
          requestId,
          sessionId: streamSessionId,
        });
        return;
      }

      markFinalizing();
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

      persistAssistantMessage(conversationId, finalText);
    } catch (err) {
      if (err.name === "AbortError") {
        terminalStatus = STREAM_STATUS.ABORTED;
        if (isActiveStreamSession(requestId, streamSessionId)) {
          finalizeStreamingResponse();
          transitionToStatus(STREAM_STATUS.ABORTED);
        } else {
          devInvariant("abort-after-ownership-regen", "Abort occurred after regen ownership changed", {
            requestId,
            sessionId: streamSessionId,
          });
        }
      } else {
        if (!isActiveStreamSession(requestId, streamSessionId)) {
          devInvariant("stale-error-regen", "Ignored stale error write in regenerate flow", {
            requestId,
            sessionId: streamSessionId,
          });
          return;
        }
        transitionToStatus(STREAM_STATUS.ERROR);
        terminalStatus = STREAM_STATUS.ERROR;
        console.error("Regeneration failed:", err);
      }
    } finally {
      if (isActiveStreamSession(requestId, streamSessionId)) {
        controllerRef.current = null;
        setIsLoading(false);
        isLoadingRef.current = false;
        invalidateStreamSession();
        transitionToStatus(terminalStatus);
        publishDevMetrics(terminalStatus);
      }
    }
  };

  const getAssistantParentKey = useCallback(
    (msg, index, sourceMessages = messages) => {
      if (msg.role !== "assistant") return null;
      if (msg.parentId) return msg.parentId;

      for (let i = index - 1; i >= 0; i--) {
        if (sourceMessages[i]?.role === "user") {
          return sourceMessages[i].id ?? `__user_slot_${i}`;
        }
      }

      return null;
    },
    [messages]
  );

  const getVersions = useCallback(
    (messageList) => {
      const map = {};

      messageList.forEach((msg, index) => {
        const parentKey = getAssistantParentKey(msg, index, messageList);
        if (parentKey) {
          if (!map[parentKey]) {
            map[parentKey] = [];
          }
          map[parentKey].push(msg);
        }
      });

      return map;
    },
    [getAssistantParentKey]
  );

  const versionMap = useMemo(() => getVersions(messages), [getVersions, messages]);
  const latestAssistantIndex = useMemo(
    () => messages.reduce((latest, msg, index) => (msg.role === "assistant" ? index : latest), -1),
    [messages]
  );
  const latestAssistantParentKey = useMemo(
    () =>
      latestAssistantIndex >= 0
        ? getAssistantParentKey(messages[latestAssistantIndex], latestAssistantIndex)
        : null,
    [getAssistantParentKey, latestAssistantIndex, messages]
  );

  const canRegenerate = (msg, index) => {
    const parentKey = getAssistantParentKey(msg, index);
    return parentKey ? parentKey === latestAssistantParentKey : index === latestAssistantIndex;
  };

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-slate-700/40 bg-slate-900/85 px-3 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={() => onOpenSidebar?.()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-700/60 text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 md:hidden"
            aria-label="Open chats sidebar"
          >
            ≡
          </button>
          <AppLogo />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold tracking-tight text-gray-100">
              ChatPro
            </div>
            <div className="truncate text-xs text-gray-500 md:hidden">AI workspace</div>
            <div className="hidden truncate text-xs text-slate-400 md:block">{chatTitle}</div>
          </div>
        </div>
      </header>

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10">
              <Sparkles className="h-7 w-7 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">What can I help with?</h2>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Pick a starter below or type your own question in the box at the bottom.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {STARTER_PROMPTS.map(({ text, icon: Icon }) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => sendMessage(text)}
                  className="glass-panel flex items-start gap-3 px-4 py-3 text-left text-sm text-slate-200 transition-all hover:border-blue-500/40 hover:bg-slate-800/60"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <span>{text}</span>
                </button>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-500">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto flex w-full max-w-4xl min-h-0 flex-1">
          <div
            ref={containerRef}
            className="flex w-full flex-1 flex-col gap-4 overflow-y-auto px-2.5 py-4 sm:gap-4 sm:px-5 sm:py-5 md:px-8 lg:px-10"
          >
            {messages.map((msg, i) => {
              const hasLargeCodeBlock = Boolean(
                markdownMetaByMessageId[msg.id]?.hasLargeCodeBlock
              );

              if (msg.role === "user") {
                return (
                  <MessageBubble
                    key={msg.id ?? `user-${i}`}
                    message={msg}
                    onEdit={() => handleEdit(i, msg.content)}
                  />
                );
              }

              const parentKey = getAssistantParentKey(msg, i);
              if (!parentKey) {
                return (
                  <MessageBubble
                    key={msg.id ?? `assistant-${i}`}
                    message={msg}
                    onRegenerate={canRegenerate(msg, i) ? regenerateResponse : undefined}
                    versionIndex={0}
                    totalVersions={1}
                    hasLargeCodeBlock={hasLargeCodeBlock}
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
                    hasLargeCodeBlock={hasLargeCodeBlock}
                  />
                );
              }

              const latest = siblings[siblings.length - 1];
              const mappedId = activeVersionMap[parentKey];
              const activeId =
                mappedId && siblings.some((s) => s.id === mappedId) ? mappedId : latest?.id;
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
                  hasLargeCodeBlock={hasLargeCodeBlock}
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

            {isLoading && !messages.some((msg) => msg.role === "assistant" && msg.isStreaming) && (
              <div className="group flex w-full justify-start animate-in fade-in slide-in-from-bottom-3 duration-200 ease-out">
                <div className="relative w-full max-w-4xl px-1 sm:px-2">
                  <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    ChatPro
                  </div>
                  <div className="max-w-[90%] rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 py-4 shadow-lg shadow-black/20 backdrop-blur-md sm:max-w-[82%] sm:px-5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400/80" />
                      <span
                        className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400/70"
                        style={{ animationDelay: "0.12s" }}
                      />
                      <span
                        className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400/60"
                        style={{ animationDelay: "0.24s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showJumpToLatest && (
            <button
              onClick={() => {
                scrollToBottom("smooth");
                setShowJumpToLatest(false);
              }}
              className="absolute bottom-4 right-4 z-20 rounded-full border border-slate-600/70 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-100 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-200 ease-out animate-in fade-in zoom-in-95 hover:border-slate-500 hover:bg-slate-800/80 hover:shadow-xl sm:bottom-6 sm:right-6"
            >
              Jump to latest
            </button>
          )}
        </div>
      )}

      <div className="mx-auto w-full max-w-4xl px-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-8 md:pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:px-10">
        <InputBox
          value={editingIndex !== null ? editingText : input}
          setValue={(val) => {
            if (editingIndex !== null) setEditingText(val);
            else setInput(val);
          }}
          onSend={sendMessage}
          onStop={stopGeneration}
          isLoading={isLoading}
          selectedModelKey={selectedModelKey}
          onModelChange={handleModelChange}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
