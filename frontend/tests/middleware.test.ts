import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "../middleware";

function requestFor(path: string, authenticated = false): NextRequest {
  const request = new NextRequest(`http://localhost:3000${path}`);
  if (authenticated) request.cookies.set("token", "session-token");
  return request;
}

describe("server-side auth guard (audit #93)", () => {
  it("redirects protected deep links to /login when no session cookie exists", () => {
    for (const path of [
      "/dashboard",
      "/clients",
      "/projects",
      "/assets",
      "/notifications",
      "/users",
    ]) {
      const response = middleware(requestFor(path));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/login");
      expect(response.headers.get("location")).toContain(
        encodeURIComponent(path)
      );
    }
  });

  it("allows protected pages when the session cookie is present", () => {
    const response = middleware(requestFor("/dashboard?range=30", true));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'self'"
    );
  });

  it("does not gate public pages", () => {
    for (const path of ["/", "/login", "/register"]) {
      expect(middleware(requestFor(path)).status).toBe(200);
    }
  });
});
