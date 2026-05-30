import React from "react";

export const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <svg
      className="h-24 w-24 text-gray-400 mb-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7h18M3 12h18M3 17h18" />
    </svg>
    <h2 className="text-xl font-medium text-gray-200 mb-2">No conversations yet</h2>
    <p className="text-sm text-gray-400 mb-4">Start a new chat to begin interacting with the AI.</p>
    <button
      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors animate-pulse"
      onClick={() => window.dispatchEvent(new CustomEvent('create-new-chat'))}
    >
      New chat
    </button>
  </div>
);

export default EmptyState;
