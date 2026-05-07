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
        flex min-w-0 items-end gap-2 rounded-2xl px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3
        bg-[#020617] border transition-all duration-200 ease-out
        ${isFocused ? "border-blue-500 shadow-sm shadow-blue-950/30 ring-1 ring-blue-500/25" : "border-[#1e293b]"}
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
        rows={1}
        className="
          min-w-0 flex-1 resize-none bg-transparent outline-none
          text-gray-200 placeholder:text-gray-500
          text-sm leading-relaxed
          max-h-[120px] overflow-hidden
        "
      />

      {/* BUTTON */}
      {isLoading ? (
        <button
          onClick={onStop}
          className="
            shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium sm:px-4
            bg-red-600 text-white
            hover:bg-red-500 hover:brightness-110 active:scale-95
            transition-all duration-200 ease-out
          "
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`
  shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium sm:px-4
  text-white transition-all duration-200 ease-out
  ${
    value.trim()
      ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-md hover:brightness-110 hover:shadow-lg active:scale-95"
      : "bg-blue-600/40 cursor-not-allowed opacity-70"
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
