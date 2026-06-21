export const coerceText = (value) => {
  if (typeof value === "string") {
    return value;
  }

  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((part) => {
      if (typeof part === "string") return part;
      if (typeof part?.text === "string") return part.text;
      if (typeof part?.content === "string") return part.content;
      if (typeof part?.refusal === "string") return part.refusal;
      return "";
    })
    .join("");
};

export const extractPrimaryText = (choice) => {
  const delta = choice?.delta ?? {};
  const candidates = [
    delta.content,
    choice?.message?.content,
    delta.text,
    choice?.text,
    delta.output_text,
    choice?.output_text,
  ];

  for (const value of candidates) {
    const normalized = coerceText(value);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return "";
};

export const extractFallbackText = (choice) => {
  const delta = choice?.delta ?? {};

  if (typeof delta.reasoning === "string" && delta.reasoning.length > 0) {
    return delta.reasoning;
  }

  const details = delta.reasoning_details;
  if (!Array.isArray(details)) {
    return "";
  }

  return details
    .map((item) => {
      const summary = coerceText(item?.summary);
      if (summary) return summary;
      return coerceText(item?.text);
    })
    .join("");
};

export const createSseLineProcessor = (onChunk) => {
  let primaryText = "";
  let fallbackText = "";
  let hasPrimaryText = false;

  const processLine = (rawLine) => {
    const line = rawLine.trim();
    if (!line || !line.startsWith("data:")) {
      return;
    }

    const payload = line.slice(5).trim();
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

  const getResult = () => (hasPrimaryText ? primaryText : fallbackText);

  return { processLine, getResult };
};
