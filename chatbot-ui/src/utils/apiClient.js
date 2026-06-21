import { getOrCreateClientId } from "./clientId";

const DEFAULT_API_URL = "https://chatpro-backend-lxvu.onrender.com";
const LOCAL_API_URL = "http://localhost:8000";

export class BackendUnavailableError extends Error {
  constructor(message = "Backend unavailable", cause) {
    super(message);
    this.name = "BackendUnavailableError";
    this.cause = cause;
  }
}

export const isNetworkError = (error) =>
  error instanceof TypeError ||
  error?.name === "AbortError" ||
  error?.message?.includes("Failed to fetch");

export const getApiUrl = () => {
  if (typeof window !== "undefined" && window.API_URL) {
    return window.API_URL;
  }

  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_API_URL;
  }

  return DEFAULT_API_URL;
};

/**
 * Fetch wrapper that attaches X-Client-ID on every backend request.
 */
export const apiFetch = (path, options = {}) => {
  const url = path.startsWith("http") ? path : `${getApiUrl()}${path}`;
  const headers = {
    ...options.headers,
    "X-Client-ID": getOrCreateClientId(),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

/** Quick health probe — returns false when backend is not running. */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await apiFetch("/", { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}
