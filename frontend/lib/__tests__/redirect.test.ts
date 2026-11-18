import { describe, expect, it } from "vitest";

import { DEFAULT_NEXT_PATH, safeNextPath } from "../redirect";

describe("safeNextPath", () => {
  it("keeps internal paths, including query and hash", () => {
    expect(safeNextPath("/assets")).toBe("/assets");
    expect(safeNextPath("/assets?page=2&type=ssl")).toBe("/assets?page=2&type=ssl");
    expect(safeNextPath("/assets/12#renewal")).toBe("/assets/12#renewal");
  });

  it("trims surrounding whitespace", () => {
    expect(safeNextPath("  /projects  ")).toBe("/projects");
  });

  it("falls back when the value is missing or blank", () => {
    expect(safeNextPath(undefined)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath(null)).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("   ")).toBe(DEFAULT_NEXT_PATH);
  });

  it("rejects absolute URLs (open redirect)", () => {
    expect(safeNextPath("https://evil.example.com")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("http://evil.example.com/login")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("HTTPS://EVIL.EXAMPLE.COM")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("//evil.example.com/login")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("/\\evil.example.com")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("\\/evil.example.com")).toBe(DEFAULT_NEXT_PATH);
  });

  it("rejects dangerous schemes", () => {
    expect(safeNextPath("javascript:alert(1)")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("data:text/html;base64,PHNjcmlwdD4=")).toBe(DEFAULT_NEXT_PATH);
    expect(safeNextPath("/redirect?url=javascript:alert(1)")).toBe(
      "/redirect?url=javascript:alert(1)"
    );
  });

  it("rejects credentials smuggled into the URL", () => {
    expect(safeNextPath("/login@evil.example.com")).toBe("/login@evil.example.com");
    expect(safeNextPath("https://user:pass@evil.example.com")).toBe(
      DEFAULT_NEXT_PATH
    );
  });

  it("rejects control characters", () => {
    expect(safeNextPath("/dashboard\nHost: evil.example.com")).toBe(
      DEFAULT_NEXT_PATH
    );
    expect(safeNextPath("/\tdashboard")).toBe(DEFAULT_NEXT_PATH);
  });

  it("honours a custom fallback", () => {
    expect(safeNextPath("https://evil.example.com", "/login")).toBe("/login");
  });
});
