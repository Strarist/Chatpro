/**
 * Markdown Processing Worker Manager
 *
 * Async interface for offloading markdown processing to a Web Worker.
 * Prevents main-thread blocking on large messages with code blocks.
 *
 * Usage:
 *   const { processed, metadata } = await processMarkdownInWorker(content);
 */

import WorkerUrl from "../workers/markdownWorker.js?worker&url";

let worker = null;
let requestId = 0;
const pendingRequests = new Map();

/**
 * Initialize the worker (lazy)
 */
const initWorker = () => {
  if (worker) return worker;

  try {
    worker = new Worker(WorkerUrl, { type: "module" });

    worker.onmessage = (event) => {
      const { id, processed, metadata, status, error } = event.data;
      const request = pendingRequests.get(id);
      if (!request) return;

      if (status === "error") {
        request.reject(new Error(error));
      } else {
        request.resolve({ processed, metadata });
      }
      pendingRequests.delete(id);
    };

    worker.onerror = (error) => {
      console.error("Markdown worker error:", error);
      for (const [, req] of pendingRequests) {
        req.reject(error);
      }
      pendingRequests.clear();
      worker = null;
    };

    return worker;
  } catch (error) {
    console.error("Failed to initialize markdown worker:", error);
    return null;
  }
};

/**
 * Process markdown content in the worker.
 * Returns { processed, metadata } or falls back gracefully.
 */
export const processMarkdownInWorker = (content) => {
  return new Promise((resolve) => {
    if (!content) {
      resolve({ processed: content, metadata: null });
      return;
    }

    const w = initWorker();
    if (!w) {
      resolve({ processed: content, metadata: null });
      return;
    }

    const currentId = ++requestId;
    const timeout = setTimeout(() => {
      pendingRequests.delete(currentId);
      resolve({ processed: content, metadata: null });
    }, 5000);

    pendingRequests.set(currentId, {
      resolve: (result) => {
        clearTimeout(timeout);
        resolve(result);
      },
      reject: () => {
        clearTimeout(timeout);
        resolve({ processed: content, metadata: null });
      },
    });

    w.postMessage({ id: currentId, content });
  });
};

/**
 * Terminate the worker (cleanup)
 */
export const terminateMarkdownWorker = () => {
  if (worker) {
    worker.terminate();
    worker = null;
    pendingRequests.clear();
  }
};

/**
 * React hook for markdown processing
 */
export const useMarkdownProcessor = () => {
  return { processMarkdown: processMarkdownInWorker };
};
