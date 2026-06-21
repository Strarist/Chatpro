export function createStreamSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isActiveStreamSession(
  requestId,
  sessionId,
  activeRequestId,
  currentSessionId,
  isMounted
) {
  return (
    isMounted &&
    activeRequestId === requestId &&
    currentSessionId === sessionId
  );
}
