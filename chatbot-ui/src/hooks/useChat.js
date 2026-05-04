import { useState } from "react";
import { fetchAIResponse } from "../services/aiService";

export const useChat = () => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything." },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    const userMsg = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    setIsLoading(true);

    try {
      const aiResponse = await fetchAIResponse([
        ...messages,
        userMsg
      ]);

      // 🔥 Step 1: Add empty AI message
      let currentText = "";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "" },
      ]);

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