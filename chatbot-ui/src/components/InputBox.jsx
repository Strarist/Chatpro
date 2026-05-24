import { useRef, useEffect, useState } from "react";

const InputBox = ({ value, setValue, onSend, onStop, isLoading }) => {
  const textareaRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // =========================
  // 🔥 AUTO FOCUS
  // =========================
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  // =========================
  // 🔥 AUTO RESIZE
  // =========================
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

  // =========================
  // 🚀 SEND MESSAGE
  // =========================
  const handleSend = () => {
    if (!value.trim() || isLoading) return;

    onSend(value.trim());
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // =========================
  // ⌨️ KEY HANDLING
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`
        flex min-w-0 items-end gap-2 rounded-2xl px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5
        bg-slate-800/40 border backdrop-blur-md transition-all duration-300 ease-out
        ${
          isFocused
            ? "border-blue-500/50 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/30 bg-slate-800/60"
            : "border-slate-700/40 shadow-md shadow-black/20"
        }
      `}
    >
      {/* TEXTAREA */}
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
          min-w-0 flex-1 resize-none bg-transparent outline-none
          text-gray-100 placeholder:text-gray-500
          text-base leading-relaxed font-medium sm:text-sm
          max-h-[120px] overflow-hidden
        "
      />

      {/* BUTTON */}
      {isLoading ? (
        <button
          onClick={onStop}
          className="
            shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold sm:px-5
            bg-gradient-to-r from-red-600 to-red-500 text-white
            hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-950/30 active:scale-95
            transition-all duration-200 ease-out shadow-md shadow-red-950/20
          "
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`
            shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold sm:px-5
            text-white transition-all duration-200 ease-out
            ${
              value.trim()
                ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-blue-400 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95"
                : "bg-blue-600/30 cursor-not-allowed opacity-50"
            }
          `}
        >
          Send
        </button>
      )}
    </div>
  );
};

export default InputBox;
