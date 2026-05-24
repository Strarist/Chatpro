import { useState } from "react";
import {
  getModel,
  getModelsByCategory,
  getPopularModels,
  getSpeedLabel,
  getQualityLabel,
  getCostLabel,
} from "../config/models";

const STORAGE_KEY = "chatpro.selectedModel";

/**
 * ModelSelector Component
 *
 * Premium minimal UI for selecting AI models.
 * Persists selection to localStorage.
 */
export const ModelSelector = ({ selectedModelKey, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const currentModel = getModel(selectedModelKey);
  const popularModels = getPopularModels();
  const categorizedModels = getModelsByCategory();

  // Filter models by search term
  const getFilteredModels = () => {
    const term = searchTerm.toLowerCase();
    if (!term) return { popular: true };

    const filtered = {};
    for (const [provider, models] of Object.entries(categorizedModels)) {
      const matches = models.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.provider.toLowerCase().includes(term) ||
          m.description.toLowerCase().includes(term)
      );
      if (matches.length > 0) {
        filtered[provider] = matches;
      }
    }
    return filtered;
  };

  const handleModelSelect = (modelKey) => {
    onModelChange(modelKey);
    localStorage.setItem(STORAGE_KEY, modelKey);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-900/40 px-3 py-2 text-sm text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-800/60 hover:text-slate-100 md:px-4 md:py-2.5"
        title="Click to change AI model"
      >
        <span className="hidden sm:inline">🤖</span>
        <span className="truncate max-w-[120px] font-medium md:max-w-none">
          {currentModel.name}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-slate-700/60 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur-md sm:w-96">
            {/* Search */}
            <div className="border-b border-slate-700/40 p-3">
              <input
                autoFocus
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none ring-1 ring-slate-700/40 transition-all focus:ring-slate-500"
              />
            </div>

            {/* Models List */}
            <div className="max-h-96 overflow-y-auto">
              {/* Popular Section (if not searching) */}
              {!searchTerm && (
                <div>
                  <div className="border-b border-slate-700/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Popular
                  </div>
                  <div className="space-y-1 p-2">
                    {popularModels.map((model) => (
                      <ModelOption
                        key={model.id}
                        model={model}
                        isSelected={selectedModelKey === model.key}
                        onSelect={() => handleModelSelect(model.key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Categorized or Filtered Section */}
              {!searchTerm ? (
                // All providers organized by category
                <>
                  {Object.entries(categorizedModels).map(([provider, models]) => (
                    <div key={provider}>
                      <div className="border-b border-slate-700/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        {provider}
                      </div>
                      <div className="space-y-1 p-2">
                        {models.map((model) => (
                          <ModelOption
                            key={model.id}
                            model={model}
                            isSelected={selectedModelKey === model.key}
                            onSelect={() => handleModelSelect(model.key)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                // Search results
                <>
                  {Object.entries(getFilteredModels()).map(([provider, models]) => {
                    // Skip "popular" key
                    if (provider === "popular") return null;

                    return (
                      <div key={provider}>
                        <div className="border-b border-slate-700/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                          {provider}
                        </div>
                        <div className="space-y-1 p-2">
                          {models.map((model) => (
                            <ModelOption
                              key={model.id}
                              model={model}
                              isSelected={selectedModelKey === model.key}
                              onSelect={() => handleModelSelect(model.key)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* No results */}
              {searchTerm && Object.keys(getFilteredModels()).length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No models found matching &quot;{searchTerm}&quot;
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * ModelOption - Individual model in dropdown
 */
const ModelOption = ({ model, isSelected, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
        isSelected
          ? "bg-slate-700/60 text-slate-100"
          : "text-slate-300 hover:bg-slate-800/40 hover:text-slate-100"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="font-semibold text-slate-100">{model.name}</div>
          <div className="text-xs text-slate-400">{model.description}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="inline-block rounded bg-slate-800/60 px-2 py-0.5 text-xs text-slate-300">
              {getSpeedLabel(model.speed)}
            </span>
            <span className="inline-block rounded bg-slate-800/60 px-2 py-0.5 text-xs text-slate-300">
              {getQualityLabel(model.quality)}
            </span>
            <span className="inline-block rounded bg-slate-800/60 px-2 py-0.5 text-xs text-slate-300">
              {getCostLabel(model.costTier)}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/80 text-white">
            ✓
          </div>
        )}
      </div>
    </button>
  );
};


