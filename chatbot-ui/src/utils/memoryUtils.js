const MEMORY_KEY = "memory";

export function getMemory() {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }

  const raw = window.localStorage.getItem(MEMORY_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function extractMemoryFromMessage(message) {
  if (typeof message !== "string") {
    return null;
  }

  const trimmed = message.trim();
  const match = trimmed.match(/\b(?:my name is|i am|i'm)\s+([A-Za-z]{2,})\b/i);
  if (!match) {
    return null;
  }

  const name = match[1].trim();
  if (name.length < 2 || /\d/.test(name)) {
    return null;
  }

  const normalized = name[0].toUpperCase() + name.slice(1).toLowerCase();
  return { name: normalized };
}

export function updateMemory(newData) {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }

  const current = getMemory();
  const validData = Object.entries(newData || {}).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});

  const updated = { ...current, ...validData };
  window.localStorage.setItem(MEMORY_KEY, JSON.stringify(updated));
  return updated;
}
