import { useRef, useEffect } from "react";

const InputBox = ({ value, setValue, onSend, onStop, isLoading }) => {
  const textareaRef = useRef(null);

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

    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize();
  }, [value]);

  // =========================
  // 🚀 SEND MESSAGE
  // =========================
  const handleSend = () => {
    if (!value.trim() || isLoading) return;

    onSend(value);
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
    <div className="flex items-end gap-3 bg-[#020617] border border-gray-800 rounded-2xl px-4 py-3 shadow-md">

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          autoResize();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        rows={1}
        className="
          flex-1 resize-none bg-transparent text-white
          outline-none text-sm leading-relaxed
          max-h-40 overflow-y-auto
        "
      />

      {/* Button */}
      {isLoading ? (
        <button
          onClick={onStop}
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-500"
        >
          Stop
        </button>
      ) : (
        <button
          onClick={handleSend}
          disabled={!value.trim()}
          className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
        >
          Send
        </button>
      )}
    </div>
  );
};

export default InputBox;
