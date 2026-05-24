import { useState } from "react";
import { fetchAIResponse } from "../services/aiService";
import { extractMemoryFromMessage, getMemory, updateMemory } from "../utils/memoryUtils";

export const useChat = () => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything." },
  ]);

  const generateId = () => {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  };

  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    const userMsg = {
      id: generateId(),
      role: "user",
      content,
      parentId: messages.length ? messages[messages.length - 1].id : null,
    };
    setMessages((prev) => [...prev, userMsg]);

    const extracted = extractMemoryFromMessage(content);
    if (extracted) updateMemory(extracted);

    setIsLoading(true);

    try {
      const memory = getMemory();
      const recentMessages = [...messages, userMsg].slice(-8);
      const requestMessages =
        memory && typeof memory.name === "string" && memory.name.trim()
          ? [{ role: "system", content: `User name is ${memory.name.trim()}` }, ...recentMessages]
          : recentMessages;
      const aiResponse = await fetchAIResponse(requestMessages);

      // 🔥 Step 1: Add empty AI message
      let currentText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // 🔥 Step 2: Simulate streaming
      for (let i = 0; i < aiResponse.length; i++) {
        currentText += aiResponse[i];

        await new Promise((resolve) => setTimeout(resolve, 5));

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: currentText,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Something went wrong. Try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};
