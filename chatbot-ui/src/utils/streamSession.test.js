import { describe, expect, it } from "vitest";
import { createStreamSessionId, isActiveStreamSession } from "../utils/streamSession";

describe("streamSession", () => {
  it("creates non-empty session ids", () => {
    expect(createStreamSessionId()).toMatch(/^[a-z0-9-]+$/i);
  });

  it("accepts only the active request/session pair", () => {
    expect(isActiveStreamSession(1, "session-a", 1, "session-a", true)).toBe(true);
    expect(isActiveStreamSession(1, "session-a", 2, "session-a", true)).toBe(false);
    expect(isActiveStreamSession(1, "session-a", 1, "session-b", true)).toBe(false);
    expect(isActiveStreamSession(1, "session-a", 1, "session-a", false)).toBe(false);
  });
});
