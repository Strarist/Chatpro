import { useState } from "react";
import { MODELS } from "../config/models";

const STORAGE_KEY = "chatpro.selectedModel";

/**
 * Custom hook for model selection with localStorage persistence
 */
export const useModelSelection = (defaultKey = "auto") => {
  const [selectedModelKey, setSelectedModelKey] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && MODELS[saved]) {
      return saved;
    }
    return defaultKey;
  });

  const handleModelChange = (newKey) => {
    setSelectedModelKey(newKey);
    localStorage.setItem(STORAGE_KEY, newKey);
  };

  return { selectedModelKey, handleModelChange };
};
