// Production-safe API URL
const API_URL = (() => {
  const defaultUrl = "https://chatpro-backend-lxvu.onrender.com";
  const localUrl = "http://localhost:8000";
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  if (window.API_URL) return window.API_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (hostname === "localhost" || hostname === "127.0.0.1") return localUrl;
  return defaultUrl;
})();

/**
 * Streams AI response from the backend.
 *
 * @param {Array} messages - Chat messages.
 * @param {Function} onChunk - Called with the progressively built response text.
 * @param {AbortController} controller - Optional abort controller.
 */
export const streamAIResponse = async (messages, onChunk, controller) => {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
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

  let primaryText = "";
  let fallbackText = "";
  let hasPrimaryText = false;
  let buffer = "";

  const extractPrimaryText = (choice) => {
    const delta = choice?.delta ?? {};
    const candidates = [delta.content, choice?.message?.content, delta.text, choice?.text];

    for (const value of candidates) {
      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }

    return "";
  };

  const extractFallbackText = (choice) => {
    const delta = choice?.delta ?? {};

    if (typeof delta.reasoning === "string" && delta.reasoning.length > 0) {
      return delta.reasoning;
    }

    const details = delta.reasoning_details;
    if (!Array.isArray(details)) {
      return "";
    }

    return details.map((item) => (typeof item?.summary === "string" ? item.summary : "")).join("");
  };

  const processLine = (rawLine) => {
    const line = rawLine.trim();
    if (!line || !line.startsWith("data: ")) {
      return;
    }

    const payload = line.slice(6).trim();
    if (payload === "[DONE]") {
      return;
    }

    let json;
    try {
      json = JSON.parse(payload);
    } catch {
      return;
    }

    if (json?.error?.message) {
      throw new Error(json.error.message);
    }

    const choice = json?.choices?.[0];
    const text = extractPrimaryText(choice);

    if (text) {
      hasPrimaryText = true;
      primaryText += text;
      onChunk(primaryText);
      return;
    }

    if (!hasPrimaryText) {
      const fallback = extractFallbackText(choice);
      if (fallback) {
        fallbackText += fallback;
        onChunk(fallbackText);
      }
    }
  };

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

  // Handle any remaining partial line
  if (buffer) {
    processLine(buffer);
  }

  return hasPrimaryText ? primaryText : fallbackText;
};
