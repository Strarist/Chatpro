import { useState } from "react";

const STORAGE_KEY = "chatpro.selectedModel";

/**
 * Custom hook for model selection with localStorage persistence
 */
export const useModelSelection = (defaultKey = "gpt-4-1") => {
  const [selectedModelKey, setSelectedModelKey] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? saved : defaultKey;
  });

  const handleModelChange = (newKey) => {
    setSelectedModelKey(newKey);
    localStorage.setItem(STORAGE_KEY, newKey);
  };

  return { selectedModelKey, handleModelChange };
};
