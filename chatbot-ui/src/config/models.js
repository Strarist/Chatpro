/**
 * Multi-model AI architecture for ChatPro.
 *
 * Provides centralized model management, metadata, and selection.
 * Integrates with OpenRouter's extensive model catalog.
 *
 * Design principles:
 * - Lightweight configuration
 * - Provider variance tolerance
 * - Streaming compatibility
 * - User-friendly metadata
 */

// =========================
// MODEL REGISTRY
// =========================

export const MODELS = {
  // OpenAI
  "gpt-4-turbo": {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    contextWindow: 128000,
    speed: "medium",
    quality: "excellent",
    costTier: "premium",
    description: "Most capable model for complex reasoning and analysis",
  },
  "gpt-4-1": {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    contextWindow: 128000,
    speed: "medium",
    quality: "excellent",
    costTier: "premium",
    description: "Latest GPT-4 with improved reasoning",
  },
  "gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    contextWindow: 128000,
    speed: "fast",
    quality: "excellent",
    costTier: "premium",
    description: "Fast and capable multimodal model",
  },
  "gpt-3.5-turbo": {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
    contextWindow: 16000,
    speed: "very-fast",
    quality: "good",
    costTier: "affordable",
    description: "Fast, cost-effective model for general tasks",
  },

  // Anthropic Claude
  "claude-3.5-sonnet": {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    contextWindow: 200000,
    speed: "fast",
    quality: "excellent",
    costTier: "premium",
    description: "Balanced intelligence and speed with extended context",
  },
  "claude-3-opus": {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    contextWindow: 200000,
    speed: "medium",
    quality: "excellent",
    costTier: "premium",
    description: "Most capable Claude model for complex reasoning",
  },
  "claude-3-sonnet": {
    id: "anthropic/claude-3-sonnet",
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    contextWindow: 200000,
    speed: "fast",
    quality: "excellent",
    costTier: "standard",
    description: "Balanced performance and intelligence",
  },

  // Google Gemini
  "gemini-2-flash": {
    id: "google/gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    contextWindow: 1000000,
    speed: "very-fast",
    quality: "excellent",
    costTier: "affordable",
    description: "Fastest model with native 1M context window",
  },
  "gemini-1.5-pro": {
    id: "google/gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    contextWindow: 1000000,
    speed: "medium",
    quality: "excellent",
    costTier: "premium",
    description: "Highly capable with massive context window",
  },

  // Meta Llama
  "llama-3.3-70b": {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    contextWindow: 8192,
    speed: "medium",
    quality: "good",
    costTier: "affordable",
    description: "Open-source large language model from Meta",
  },

  // DeepSeek
  "deepseek-r1": {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    contextWindow: 64000,
    speed: "medium",
    quality: "excellent",
    costTier: "affordable",
    description: "Fast reasoning model with extended context",
  },

  // Mistral
  "mistral-large": {
    id: "mistralai/mistral-large",
    name: "Mistral Large",
    provider: "Mistral AI",
    contextWindow: 32000,
    speed: "medium",
    quality: "good",
    costTier: "standard",
    description: "Large, capable open model from Mistral",
  },

  // Auto (fallback)
  "auto": {
    id: "openrouter/auto",
    name: "Auto (Best)",
    provider: "OpenRouter",
    contextWindow: 4096,
    speed: "fast",
    quality: "good",
    costTier: "balanced",
    description: "OpenRouter automatically selects best model",
  },
};

// =========================
// MODEL UTILITIES
// =========================

/**
 * Get a model by key or ID.
 */
export const getModel = (key) => {
  // Check by key
  if (MODELS[key]) {
    return MODELS[key];
  }

  // Check by ID
  const found = Object.values(MODELS).find((m) => m.id === key);
  if (found) {
    return found;
  }

  // Default to auto
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
  const popular = [
    "gpt-4-1",
    "claude-3.5-sonnet",
    "gemini-2-flash",
    "gpt-4o",
    "claude-3-opus",
  ];

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
