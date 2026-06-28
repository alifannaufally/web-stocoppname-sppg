import { describe, it, expect } from "vitest";

describe("proxy matcher configuration", () => {
  const matcherPattern = "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)";

  function matches(path: string): boolean {
    return new RegExp(`^${matcherPattern}$`).test(path);
  }

  it("matches API routes", () => {
    expect(matches("/api/users")).toBe(true);
    expect(matches("/api/auth/callback")).toBe(true);
    expect(matches("/api/auth/logout")).toBe(true);
  });

  it("matches page routes", () => {
    expect(matches("/")).toBe(true);
    expect(matches("/login")).toBe(true);
    expect(matches("/pengguna")).toBe(true);
    expect(matches("/input")).toBe(true);
    expect(matches("/laporan")).toBe(true);
  });

  it("excludes Next.js static assets", () => {
    expect(matches("/_next/static/chunks/main.js")).toBe(false);
    expect(matches("/_next/static/css/styles.css")).toBe(false);
  });

  it("excludes Next.js image optimization", () => {
    expect(matches("/_next/image/abc123")).toBe(false);
  });

  it("excludes favicon", () => {
    expect(matches("/favicon.ico")).toBe(false);
  });

  it("excludes static image files", () => {
    expect(matches("/images/logo.svg")).toBe(false);
    expect(matches("/images/photo.png")).toBe(false);
    expect(matches("/images/bg.jpg")).toBe(false);
    expect(matches("/images/banner.jpeg")).toBe(false);
    expect(matches("/images/icon.gif")).toBe(false);
    expect(matches("/images/photo.webp")).toBe(false);
  });
});
