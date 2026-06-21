import { apiFetch } from "../utils/apiClient";
import { createSseLineProcessor } from "./sseParser";

/**
 * Streams AI response from the backend.
 */
export const streamAIResponse = async (messages, onChunk, controller, model, conversationId) => {
  const body = { messages };

  if (model) {
    body.model = model;
  }
  if (conversationId) {
    body.conversation_id = conversationId;
  }

  const res = await apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify(body),
    signal: controller?.signal,
  });

  if (!res.ok) {
    let errorMessage = "Network response failed";

    try {
      const errorData = await res.json();
      errorMessage = errorData?.error?.message || errorData?.detail || errorMessage;
    } catch {
      // Ignore JSON parsing failures
    }

    throw new Error(errorMessage);
  }

  if (!res.body) {
    throw new Error("Response body is empty");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  const { processLine, getResult } = createSseLineProcessor(onChunk);
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    if (!chunk) continue;

    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop();

    for (const line of lines) {
      processLine(line);
    }
  }

  if (buffer) {
    processLine(buffer);
  }

  return getResult();
};
