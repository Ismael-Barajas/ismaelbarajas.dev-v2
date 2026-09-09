import { describe, it, expect, vi, afterEach } from "vitest";
import fetcher, { FetchError } from "lib/fetcher";
import { parseId } from "lib/ids";
import { isRecordNotFound } from "lib/prismaErrors";
import { sessionOptions, SESSION_TTL_SECONDS } from "lib/session";
import { timeAgo } from "lib/time";
import { readApiError } from "lib/apiError";
import { verifyAdminPassword } from "lib/adminPassword";
import { isAllowedImageUrl } from "../pages/api/now-playing";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("fetcher", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("resolves JSON for 2xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ items: [1] })));
    await expect(fetcher("/api/x")).resolves.toEqual({ items: [1] });
  });

  it("rejects non-OK responses with the API error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Spotify unavailable" }, 502)),
    );
    const err = await fetcher("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(FetchError);
    expect(err.status).toBe(502);
    expect(err.message).toBe("Spotify unavailable");
  });

  it("rejects non-JSON error bodies too", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>oops</html>", { status: 500 })),
    );
    await expect(fetcher("/api/x")).rejects.toMatchObject({ status: 500 });
  });
});

describe("parseId", () => {
  it("accepts plain positive integers", () => {
    expect(parseId("1")).toBe(1);
    expect(parseId("42")).toBe(42);
    expect(parseId(["7"])).toBe(7);
  });

  it("rejects everything parseInt would coerce", () => {
    expect(parseId("1abc")).toBeNull();
    expect(parseId("abc")).toBeNull();
    expect(parseId("0")).toBeNull();
    expect(parseId("-1")).toBeNull();
    expect(parseId("1.5")).toBeNull();
    expect(parseId(" 1")).toBeNull();
    expect(parseId("")).toBeNull();
    expect(parseId(undefined)).toBeNull();
    expect(parseId(1 as unknown)).toBeNull();
  });
});

describe("isRecordNotFound", () => {
  it("matches Prisma P2025 only", () => {
    expect(isRecordNotFound({ code: "P2025" })).toBe(true);
    expect(isRecordNotFound({ code: "P2002" })).toBe(false);
    expect(isRecordNotFound(new Error("x"))).toBe(false);
    expect(isRecordNotFound(null)).toBe(false);
  });
});

describe("sessionOptions", () => {
  it("sets the seal ttl to one day and lets iron-session derive maxAge", () => {
    expect(SESSION_TTL_SECONDS).toBe(86400);
    expect(sessionOptions.ttl).toBe(86400);
    // Setting maxAge explicitly would leave ttl at the 14-day default.
    expect(sessionOptions.cookieOptions).not.toHaveProperty("maxAge");
    expect(sessionOptions.cookieOptions?.httpOnly).toBe(true);
    expect(sessionOptions.cookieOptions?.sameSite).toBe("lax");
  });
});

describe("timeAgo (lib/time) with a frozen now", () => {
  const now = Date.parse("2026-09-07T12:00:00Z");

  it("is deterministic for the same inputs", () => {
    const iso = "2026-09-07T09:00:00Z";
    expect(timeAgo(iso, now)).toBe("3 hr ago");
    expect(timeAgo(iso, now)).toBe(timeAgo(iso, now));
  });

  it("covers the compressions release ranges", () => {
    expect(timeAgo("2026-09-07T11:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-09-07T11:15:00Z", now)).toBe("45 min ago");
    expect(timeAgo("2026-09-06T12:00:00Z", now)).toBe("yesterday");
    expect(timeAgo("2026-09-03T12:00:00Z", now)).toBe("4 days ago");
    expect(timeAgo("2026-08-17T12:00:00Z", now)).toBe("3 weeks ago");
    expect(timeAgo("2026-06-07T12:00:00Z", now)).toBe("3 months ago");
    expect(timeAgo("2024-09-07T12:00:00Z", now)).toBe("2 years ago");
  });
});

describe("readApiError", () => {
  it("prefers the API's error string", async () => {
    expect(await readApiError(jsonResponse({ error: "Invalid 'img'" }, 400), "x")).toBe(
      "Invalid 'img'",
    );
  });

  it("falls back for empty or non-JSON bodies", async () => {
    expect(await readApiError(jsonResponse({}, 400), "fallback")).toBe("fallback");
    expect(await readApiError(new Response("nope", { status: 500 }), "fallback")).toBe(
      "fallback",
    );
  });
});

describe("verifyAdminPassword", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses the bcrypt hash when configured", async () => {
    const { default: bcrypt } = await import("bcryptjs");
    vi.stubEnv("ADMIN_PASSWORD_HASH", bcrypt.hashSync("hunter2", 4));
    vi.stubEnv("ADMIN_PASSWORD", "hunter2");
    expect(await verifyAdminPassword("hunter2")).toBe(true);
    expect(await verifyAdminPassword("hunter3")).toBe(false);
  });

  it("falls back to constant-time plaintext comparison", async () => {
    vi.stubEnv("ADMIN_PASSWORD_HASH", "");
    vi.stubEnv("ADMIN_PASSWORD", "hunter2");
    expect(await verifyAdminPassword("hunter2")).toBe(true);
    expect(await verifyAdminPassword("hunter")).toBe(false);
    expect(await verifyAdminPassword("hunter22")).toBe(false);
  });

  it("denies everything when nothing is configured", async () => {
    vi.stubEnv("ADMIN_PASSWORD_HASH", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(await verifyAdminPassword("")).toBe(false);
    expect(await verifyAdminPassword("anything")).toBe(false);
  });
});

describe("isAllowedImageUrl (palette extraction)", () => {
  it("allows Spotify CDN hosts over https", () => {
    expect(isAllowedImageUrl("https://i.scdn.co/image/abc")).toBe(true);
    expect(isAllowedImageUrl("https://mosaic.scdn.co/640/abc")).toBe(true);
    expect(isAllowedImageUrl("https://image-cdn-ak.spotifycdn.com/image/abc")).toBe(true);
  });

  it("blocks everything else", () => {
    expect(isAllowedImageUrl("http://i.scdn.co/image/abc")).toBe(false);
    expect(isAllowedImageUrl("https://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isAllowedImageUrl("https://evil.com/i.scdn.co")).toBe(false);
    expect(isAllowedImageUrl("https://i.scdn.co.evil.com/x")).toBe(false);
    expect(isAllowedImageUrl("file:///etc/passwd")).toBe(false);
    expect(isAllowedImageUrl("")).toBe(false);
  });
});
