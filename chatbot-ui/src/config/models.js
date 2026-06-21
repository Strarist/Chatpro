/**
 * Multi-model AI architecture for ChatPro.
 *
 * Models are routed through the backend /chat endpoint to either
 * OpenRouter or Groq — no direct third-party provider integrations.
 */

// =========================
// MODEL REGISTRY
// =========================

export const MODELS = {
  auto: {
    id: "openrouter/auto",
    name: "Auto (Best)",
    provider: "OpenRouter",
    contextWindow: 4096,
    speed: "fast",
    quality: "good",
    costTier: "balanced",
    description: "OpenRouter automatically selects the best available model",
  },
  "groq-llama-3.3-70b": {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B (Groq)",
    provider: "Groq",
    contextWindow: 8192,
    speed: "very-fast",
    quality: "good",
    costTier: "affordable",
    description: "Fast Llama 3.3 70B inference via Groq",
  },
  "groq-llama-3.1-8b": {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B (Groq)",
    provider: "Groq",
    contextWindow: 8192,
    speed: "very-fast",
    quality: "good",
    costTier: "affordable",
    description: "Fast Llama 3.1 8B inference via Groq",
  },
};

// =========================
// MODEL UTILITIES
// =========================

/**
 * Get a model by key or ID.
 */
export const getModel = (key) => {
  if (MODELS[key]) {
    return MODELS[key];
  }

  const found = Object.values(MODELS).find((m) => m.id === key);
  if (found) {
    return found;
  }

  return MODELS.auto;
};

/**
 * Get all models sorted by category.
 */
export const getModelsByCategory = () => {
  const grouped = {};

  for (const [key, model] of Object.entries(MODELS)) {
    if (!grouped[model.provider]) {
      grouped[model.provider] = [];
    }
    grouped[model.provider].push({ key, ...model });
  }

  return grouped;
};

/**
 * Get popular models (recommended).
 */
export const getPopularModels = () => {
  const popular = ["auto", "groq-llama-3.3-70b", "groq-llama-3.1-8b"];

  return popular
    .map((key) => {
      const model = MODELS[key];
      return model ? { key, ...model } : null;
    })
    .filter(Boolean);
};

/**
 * Get speed indicator label.
 */
export const getSpeedLabel = (speed) => {
  const labels = {
    "very-fast": "⚡ Very Fast",
    fast: "⚡ Fast",
    medium: "⏱ Medium",
    slow: "🐌 Slow",
  };
  return labels[speed] || speed;
};

/**
 * Get quality indicator label.
 */
export const getQualityLabel = (quality) => {
  const labels = {
    excellent: "⭐ Excellent",
    good: "👍 Good",
    fair: "⚠️ Fair",
  };
  return labels[quality] || quality;
};

/**
 * Get cost tier label.
 */
export const getCostLabel = (tier) => {
  const labels = {
    affordable: "💰 Affordable",
    standard: "💵 Standard",
    premium: "💎 Premium",
    balanced: "⚖️ Balanced",
  };
  return labels[tier] || tier;
};
