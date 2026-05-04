import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { streamAIResponse } from "../services/aiService";

const ChatWindow = ({ messages = [], setMessages }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const activeRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);


  // =========================
  // ✅ AUTO SCROLL
  // =========================
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages]);

  // =========================
  // 🚀 SEND MESSAGE
  // =========================
  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
  
    let updatedMessages;
  
    // ✅ EDIT MODE
    if (editingIndex !== null) {
      updatedMessages = messages.slice(0, editingIndex + 1);
  
      updatedMessages[editingIndex] = {
        role: "user",
        content,
      };
  
      setEditingIndex(null);
    } else {
      // ✅ NORMAL FLOW
      updatedMessages = [...messages, { role: "user", content }];
    }
  
    setMessages(updatedMessages);
    setIsLoading(true);
  
    try {
      controllerRef.current = new AbortController();
  
      // ✅ Add assistant placeholder
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", isStreaming: true },
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
      if (err.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Error generating response" },
        ]);
      }
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
  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  // =========================
  // 🔄 REGENERATE
  // =========================
  const regenerateResponse = async () => {
    if (isLoading) return;
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
  
    controllerRef.current?.abort();
  
    // ✅ Remove LAST assistant only
    let trimmed = [...messages];
  
    while (
      trimmed.length &&
      trimmed[trimmed.length - 1].role === "assistant"
    ) {
      trimmed.pop();
    }
  
    setMessages(trimmed);
  
    setIsLoading(true);
  
    try {
      controllerRef.current = new AbortController();
  
      // Add assistant placeholder
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", isStreaming: true },
      ]);
  
      await streamAIResponse(
        trimmed, // ✅ NO NEW USER MESSAGE
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
      if (err.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Error generating response" },
        ]);
      }
    } finally {
      if (isMountedRef.current && requestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
      if (controllerRef.current?.signal?.aborted || requestId === activeRequestIdRef.current) {
        controllerRef.current = null;
      }
    }
  };

  return (
    <div className="flex flex-col h-full items-center">

      {/* Messages */}
      <div
        ref={containerRef}
        className="w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble
                message={{ ...msg, isLast }}
                onRegenerate={regenerateResponse}
                onEdit={() => handleEdit(i)}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className="w-full max-w-3xl px-4 pb-6">
      <InputBox
  key={editingIndex ?? -1}
  onSend={sendMessage}
  onStop={stopGeneration}
  isLoading={isLoading}
  initialValue={
    editingIndex !== null ? messages[editingIndex]?.content : ""
  }
/>
      </div>
    </div>
  );
};

export default ChatWindow;