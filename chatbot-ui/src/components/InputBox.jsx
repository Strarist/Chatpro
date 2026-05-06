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
        flex items-end gap-3 px-4 py-3 rounded-2xl
        bg-[#020617] border transition-all duration-200
        ${isFocused ? "border-blue-500 ring-1 ring-blue-500/30" : "border-[#1e293b]"}
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
          flex-1 resize-none bg-transparent outline-none
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
            px-4 py-2 rounded-full text-sm font-medium
            bg-red-600 text-white
            hover:bg-red-500 active:scale-95
            transition-all duration-150
          "
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className={`
  px-4 py-2 rounded-full text-sm font-medium
  text-white transition-all duration-200 ease-out
  ${
    value.trim()
      ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-110 active:scale-95 shadow-md hover:shadow-lg"
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