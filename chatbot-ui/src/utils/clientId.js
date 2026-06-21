const STORAGE_KEY = "chatpro.clientId";

/**
 * Returns a stable per-browser client UUID for backend conversation ownership.
 */
export function getOrCreateClientId() {
  if (typeof window === "undefined" || !window.localStorage) {
    return "";
  }

  let clientId = window.localStorage.getItem(STORAGE_KEY);
  if (clientId) {
    return clientId;
  }

  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    clientId = crypto.randomUUID();
  } else {
    clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  window.localStorage.setItem(STORAGE_KEY, clientId);
  return clientId;
}
