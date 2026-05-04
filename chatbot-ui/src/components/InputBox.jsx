import { useState, useRef, useEffect } from "react";

const InputBox = ({ onSend, onStop, isLoading, initialValue = "" }) => {
  const [input, setInput] = useState(initialValue);
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
  }, [input]);

  // =========================
  // 🚀 SEND MESSAGE
  // =========================
  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    onSend(input);
    setInput("");

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
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
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
          disabled={!input.trim()}
          className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
        >
          Send
        </button>
      )}
    </div>
  );
};

export default InputBox;