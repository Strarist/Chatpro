import { describe, expect, it } from "vitest";
import { createSseLineProcessor, extractPrimaryText } from "../services/sseParser";

describe("sseParser", () => {
  it("extracts OpenAI-style delta content", () => {
    const text = extractPrimaryText({
      delta: { content: "Hello" },
    });
    expect(text).toBe("Hello");
  });

  it("accumulates streamed chunks", () => {
    const chunks = [];
    const { processLine, getResult } = createSseLineProcessor((value) => chunks.push(value));

    processLine('data: {"choices":[{"delta":{"content":"Hel"}}]}');
    processLine('data: {"choices":[{"delta":{"content":"lo"}}]}');
    processLine("data: [DONE]");

    expect(chunks).toEqual(["Hel", "Hello"]);
    expect(getResult()).toBe("Hello");
  });

  it("ignores malformed SSE lines", () => {
    const chunks = [];
    const { processLine, getResult } = createSseLineProcessor((value) => chunks.push(value));

    processLine("not-sse");
    processLine("data: {bad json");
    processLine('data: {"choices":[{"delta":{"content":"ok"}}]}');

    expect(getResult()).toBe("ok");
  });

  it("throws on embedded stream errors", () => {
    const { processLine } = createSseLineProcessor(() => {});

    expect(() => {
      processLine('data: {"error":{"message":"upstream failed"}}');
    }).toThrow("upstream failed");
  });
});
