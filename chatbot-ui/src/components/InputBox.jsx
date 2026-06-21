import { useRef, useEffect, useState } from "react";
import { ModelSelector } from "./ModelSelector";

const InputBox = ({
  value,
  setValue,
  onSend,
  onStop,
  isLoading,
  selectedModelKey,
  onModelChange,
}) => {
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;

    const maxHeight = 120;

    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;

    onSend(value.trim());
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div
        className={`
          min-w-0 rounded-2xl border bg-slate-800/40 px-3 py-3 backdrop-blur-md transition-all duration-300 ease-out
          sm:px-4 sm:py-3.5
          ${
            isFocused
              ? "border-blue-500/50 bg-slate-800/60 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/30"
              : "border-slate-700/40 shadow-md shadow-black/20"
          }
        `}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autoResize();
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Message ChatPro..."
          enterKeyHint="send"
          rows={1}
          className="
            max-h-[120px] min-h-[24px] w-full resize-none overflow-hidden bg-transparent
            text-base font-medium leading-relaxed text-gray-100 outline-none
            placeholder:text-gray-500 sm:text-sm
          "
        />

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-700/30 pt-2">
          <ModelSelector
            variant="composer"
            selectedModelKey={selectedModelKey}
            onModelChange={onModelChange}
          />

          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="
                shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold
                bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-950/20
                transition-all duration-200 ease-out hover:from-red-500 hover:to-red-400
                hover:shadow-lg hover:shadow-red-950/30 active:scale-95
              "
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!value.trim()}
              className={`
                shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold
                text-white transition-all duration-200 ease-out
                ${
                  value.trim()
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
                    : "cursor-not-allowed bg-blue-600/30 opacity-50"
                }
              `}
            >
              Send
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 hidden text-center text-[11px] text-slate-500 md:block">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
};

export default InputBox;
