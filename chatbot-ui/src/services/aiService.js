export const streamAIResponse = async (messages, onChunk, controller) => {
  const res = await fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
    signal: controller?.signal,
  });

  if (!res.ok) {
    throw new Error("Network response failed");
  }

  if (!res.body) {
    throw new Error("Response body is empty");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });

    // 🔥 FIX: only append NEW data
    const newPart = chunk;

    fullText += newPart;

    onChunk(fullText); // always send full clean text
  }

  const tail = decoder.decode();
  if (tail) {
    fullText += tail;
    onChunk(fullText);
  }
};