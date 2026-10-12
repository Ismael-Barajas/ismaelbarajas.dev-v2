import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  rateLimit,
  validateOrigin,
  getAllowedHosts,
  csrfCheck,
  validateProjectInput,
  validateExperienceInput,
  validateProfileInput,
  validateContactLinkInput,
  validateReorderInput,
  sanitizeFacts,
  isBlobImageUrl,
  isHttpsOrMailto,
} from "lib/security";

// --- Helpers to create mock req/res ---

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    headers: {} as Record<string, string | string[] | undefined>,
    socket: { remoteAddress: "127.0.0.1" },
    body: {},
    query: {},
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// --- Rate Limiter ---

describe("rateLimit", () => {
  beforeEach(() => {
    // Reset rate limit store between tests by using unique IPs
  });

  it("allows requests under the limit", async () => {
    const req = mockReq({
      socket: { remoteAddress: `10.0.0.${Math.random()}` },
    });
    expect(await rateLimit(req, { maxAttempts: 3, windowMs: 60000 })).toBe(false);
    expect(await rateLimit(req, { maxAttempts: 3, windowMs: 60000 })).toBe(false);
    expect(await rateLimit(req, { maxAttempts: 3, windowMs: 60000 })).toBe(false);
  });

  it("blocks requests over the limit", async () => {
    const ip = `10.1.0.${Math.random()}`;
    const req = mockReq({ socket: { remoteAddress: ip } });
    const opts = { maxAttempts: 2, windowMs: 60000 };

    expect(await rateLimit(req, opts)).toBe(false); // 1
    expect(await rateLimit(req, opts)).toBe(false); // 2
    expect(await rateLimit(req, opts)).toBe(true); // 3 -> blocked
  });

  it("uses x-forwarded-for header when available", async () => {
    const ip = `10.2.0.${Math.random()}`;
    const req = mockReq({
      headers: { "x-forwarded-for": ip },
      socket: { remoteAddress: "different-ip" },
    });
    const opts = { maxAttempts: 1, windowMs: 60000 };

    expect(await rateLimit(req, opts)).toBe(false); // 1
    expect(await rateLimit(req, opts)).toBe(true); // blocked
  });

  it("takes first IP from x-forwarded-for chain", async () => {
    const ip = `10.3.0.${Math.random()}`;
    const req = mockReq({
      headers: { "x-forwarded-for": `${ip}, 192.168.1.1, 10.0.0.1` },
      socket: { remoteAddress: "fallback" },
    });
    const opts = { maxAttempts: 1, windowMs: 60000 };

    expect(await rateLimit(req, opts)).toBe(false);
    expect(await rateLimit(req, opts)).toBe(true);
  });

  it("defaults to 5 max attempts", async () => {
    const ip = `10.4.0.${Math.random()}`;
    const req = mockReq({ socket: { remoteAddress: ip } });

    for (let i = 0; i < 5; i++) {
      expect(await rateLimit(req)).toBe(false);
    }
    expect(await rateLimit(req)).toBe(true);
  });

  it("keeps separate buckets per prefix", async () => {
    const ip = `10.5.0.${Math.random()}`;
    const req = mockReq({ socket: { remoteAddress: ip } });
    const opts = { maxAttempts: 1, windowMs: 60000 };

    expect(await rateLimit(req, { ...opts, prefix: "a" })).toBe(false);
    expect(await rateLimit(req, { ...opts, prefix: "b" })).toBe(false);
    expect(await rateLimit(req, { ...opts, prefix: "a" })).toBe(true);
  });
});

// --- CSRF / Origin Validation ---

describe("validateOrigin", () => {
  it("allows GET requests without origin check", () => {
    const req = mockReq({ method: "GET" });
    expect(validateOrigin(req)).toBe(true);
  });

  it("allows HEAD requests without origin check", () => {
    const req = mockReq({ method: "HEAD" });
    expect(validateOrigin(req)).toBe(true);
  });

  it("allows OPTIONS requests without origin check", () => {
    const req = mockReq({ method: "OPTIONS" });
    expect(validateOrigin(req)).toBe(true);
  });

  it("rejects POST with no origin or referer", () => {
    const req = mockReq({ method: "POST", headers: { host: "example.com" } });
    expect(validateOrigin(req)).toBe(false);
  });

  it("allows POST with matching origin header", () => {
    const req = mockReq({
      method: "POST",
      headers: {
        host: "mysite.com",
        origin: "https://mysite.com",
      },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("allows POST with matching referer header", () => {
    const req = mockReq({
      method: "POST",
      headers: {
        host: "mysite.com",
        referer: "https://mysite.com/admin",
      },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("rejects POST with mismatched origin", () => {
    const req = mockReq({
      method: "POST",
      headers: {
        host: "mysite.com",
        origin: "https://evil.com",
      },
    });
    expect(validateOrigin(req)).toBe(false);
  });

  it("allows localhost:3000 as a valid origin", () => {
    const req = mockReq({
      method: "POST",
      headers: {
        host: "something-else.com",
        origin: "http://localhost:3000",
      },
    });
    expect(validateOrigin(req)).toBe(true);
  });

  it("rejects invalid URL in origin", () => {
    const req = mockReq({
      method: "POST",
      headers: {
        host: "mysite.com",
        origin: "not-a-url",
      },
    });
    expect(validateOrigin(req)).toBe(false);
  });

  describe("environment-dependent allowlist", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("does not allow localhost in production", () => {
      vi.stubEnv("NODE_ENV", "production");
      const req = mockReq({
        method: "POST",
        headers: { host: "mysite.com", origin: "http://localhost:3000" },
      });
      expect(validateOrigin(req)).toBe(false);
      expect(getAllowedHosts("mysite.com")).toEqual(["mysite.com"]);
    });

    it("matches NEXT_PUBLIC_SITE_URL given as a full URL", () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ismaelbarajas.dev");
      // Host header differs (e.g. a preview alias) but Origin is the real site.
      const req = mockReq({
        method: "POST",
        headers: { host: "preview.vercel.app", origin: "https://ismaelbarajas.dev" },
      });
      expect(validateOrigin(req)).toBe(true);
    });

    it("matches NEXT_PUBLIC_SITE_URL given as a bare host", () => {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "ismaelbarajas.dev");
      const req = mockReq({
        method: "POST",
        headers: { host: "other.example", origin: "https://ismaelbarajas.dev" },
      });
      expect(validateOrigin(req)).toBe(true);
    });
  });
});

describe("csrfCheck", () => {
  it("returns false (not blocked) for valid origin", () => {
    const req = mockReq({
      method: "POST",
      headers: { host: "mysite.com", origin: "https://mysite.com" },
    });
    const res = mockRes();
    expect(csrfCheck(req, res)).toBe(false);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns true (blocked) and sends 403 for invalid origin", () => {
    const req = mockReq({
      method: "POST",
      headers: { host: "mysite.com", origin: "https://evil.com" },
    });
    const res = mockRes();
    expect(csrfCheck(req, res)).toBe(true);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
  });
});

// --- Project Input Validation ---

describe("validateProjectInput", () => {
  const validProject = {
    img: "https://example.com/img.png",
    name: "My Project",
    url: "https://example.com",
    githubUrl: "https://github.com/user/repo",
    body: ["A description"],
    tags: ["react", "typescript"],
    order: 1,
  };

  it("accepts valid input", () => {
    const result = validateProjectInput(validProject);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe("My Project");
      expect(result.data.order).toBe(1);
    }
  });

  it("trims string fields", () => {
    const result = validateProjectInput({
      ...validProject,
      name: "  My Project  ",
      body: ["  paragraph  "],
      tags: ["  react  "],
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe("My Project");
      expect(result.data.body).toEqual(["paragraph"]);
      expect(result.data.tags).toEqual(["react"]);
    }
  });

  it("defaults body and tags to empty arrays", () => {
    const result = validateProjectInput({
      ...validProject,
      body: undefined,
      tags: null,
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.body).toEqual([]);
      expect(result.data.tags).toEqual([]);
    }
  });

  it("omits order when absent so updates don't reset it", () => {
    const result = validateProjectInput({
      ...validProject,
      order: undefined,
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect("order" in result.data).toBe(false);
    }
  });

  it("rejects null input", () => {
    const result = validateProjectInput(null);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toMatch(/body is required/);
  });

  it("rejects missing img", () => {
    const result = validateProjectInput({ ...validProject, img: "" });
    expect(result.valid).toBe(false);
  });

  it("rejects non-URL img", () => {
    const result = validateProjectInput({ ...validProject, img: "not-a-url" });
    expect(result.valid).toBe(false);
  });

  it("rejects javascript: protocol URLs", () => {
    const result = validateProjectInput({
      ...validProject,
      url: "javascript:alert(1)",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    const result = validateProjectInput({
      ...validProject,
      name: "a".repeat(201),
    });
    expect(result.valid).toBe(false);
  });

  it("rejects non-string items in body array", () => {
    const result = validateProjectInput({
      ...validProject,
      body: [123, "valid"],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects body items over 5000 chars", () => {
    const result = validateProjectInput({
      ...validProject,
      body: ["a".repeat(5001)],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects more than 50 body items", () => {
    const result = validateProjectInput({
      ...validProject,
      body: Array.from({ length: 51 }, () => "item"),
    });
    expect(result.valid).toBe(false);
  });

  it("rejects tags over 100 chars", () => {
    const result = validateProjectInput({
      ...validProject,
      tags: ["a".repeat(101)],
    });
    expect(result.valid).toBe(false);
  });

  it("rejects more than 30 tags", () => {
    const result = validateProjectInput({
      ...validProject,
      tags: Array.from({ length: 31 }, () => "tag"),
    });
    expect(result.valid).toBe(false);
  });

  it("rejects negative order", () => {
    const result = validateProjectInput({ ...validProject, order: -1 });
    expect(result.valid).toBe(false);
  });

  it("rejects non-integer order", () => {
    const result = validateProjectInput({ ...validProject, order: 1.5 });
    expect(result.valid).toBe(false);
  });
});

// --- Experience Input Validation ---

describe("validateExperienceInput", () => {
  const validExperience = {
    img: "https://example.com/logo.png",
    url: "https://example.com",
    position: "Software Engineer",
    timeCommitment: "Full-time",
    body: ["Did things"],
    tags: ["react"],
    order: 0,
  };

  it("accepts valid input", () => {
    const result = validateExperienceInput(validExperience);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.position).toBe("Software Engineer");
    }
  });

  it("rejects null input", () => {
    const result = validateExperienceInput(null);
    expect(result.valid).toBe(false);
  });

  it("rejects missing position", () => {
    const result = validateExperienceInput({ ...validExperience, position: "" });
    expect(result.valid).toBe(false);
  });

  it("rejects position over 200 chars", () => {
    const result = validateExperienceInput({
      ...validExperience,
      position: "x".repeat(201),
    });
    expect(result.valid).toBe(false);
  });

  it("rejects timeCommitment over 100 chars", () => {
    const result = validateExperienceInput({
      ...validExperience,
      timeCommitment: "x".repeat(101),
    });
    expect(result.valid).toBe(false);
  });

  it("rejects non-URL img", () => {
    const result = validateExperienceInput({
      ...validExperience,
      img: "not-url",
    });
    expect(result.valid).toBe(false);
  });

  it("defaults body and tags, and omits an absent order", () => {
    const result = validateExperienceInput({
      ...validExperience,
      body: undefined,
      tags: null,
      order: undefined,
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.body).toEqual([]);
      expect(result.data.tags).toEqual([]);
      expect("order" in result.data).toBe(false);
    }
  });

  it("rejects negative order", () => {
    const result = validateExperienceInput({
      ...validExperience,
      order: -5,
    });
    expect(result.valid).toBe(false);
  });

  it("trims string fields", () => {
    const result = validateExperienceInput({
      ...validExperience,
      position: "  Engineer  ",
      timeCommitment: "  Full-time  ",
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.position).toBe("Engineer");
      expect(result.data.timeCommitment).toBe("Full-time");
    }
  });
});

describe("isBlobImageUrl", () => {
  it("accepts https Vercel Blob URLs", () => {
    expect(
      isBlobImageUrl("https://abc.public.blob.vercel-storage.com/images/me.jpg"),
    ).toBe(true);
  });

  it("rejects other hosts, http, and lookalike hosts", () => {
    expect(isBlobImageUrl("https://example.com/me.jpg")).toBe(false);
    expect(isBlobImageUrl("http://abc.public.blob.vercel-storage.com/me.jpg")).toBe(false);
    expect(isBlobImageUrl("https://public.blob.vercel-storage.com.evil.com/x.jpg")).toBe(false);
    expect(isBlobImageUrl(42)).toBe(false);
  });
});

describe("isHttpsOrMailto", () => {
  it("accepts https and mailto with an address", () => {
    expect(isHttpsOrMailto("https://github.com/me")).toBe(true);
    expect(isHttpsOrMailto("mailto:me@example.com")).toBe(true);
  });

  it("rejects http, javascript:, data: and empty mailto", () => {
    expect(isHttpsOrMailto("http://github.com/me")).toBe(false);
    expect(isHttpsOrMailto("javascript:alert(1)")).toBe(false);
    expect(isHttpsOrMailto("data:text/html,hi")).toBe(false);
    expect(isHttpsOrMailto("mailto:")).toBe(false);
    expect(isHttpsOrMailto("not a url")).toBe(false);
  });
});

describe("validateProfileInput", () => {
  const validProfile = {
    bio: ["  Hi! I'm {age}.  ", "Second paragraph"],
    photoUrl: "https://abc.public.blob.vercel-storage.com/images/me.jpg",
    facts: [{ label: " Austin, TX ", icon: "pin" }],
  };

  it("accepts and trims a valid profile", () => {
    const result = validateProfileInput(validProfile);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.bio[0]).toBe("Hi! I'm {age}.");
      expect(result.data.facts).toEqual([{ label: "Austin, TX", icon: "pin" }]);
    }
  });

  it("drops unknown keys", () => {
    const result = validateProfileInput({ ...validProfile, extra: 1 });
    expect(result.valid && "extra" in result.data).toBe(false);
  });

  it("defaults missing facts to an empty list", () => {
    const result = validateProfileInput({ ...validProfile, facts: undefined });
    expect(result.valid && result.data.facts).toEqual([]);
  });

  it("rejects empty or oversized bios", () => {
    expect(validateProfileInput({ ...validProfile, bio: [] }).valid).toBe(false);
    expect(validateProfileInput({ ...validProfile, bio: ["  "] }).valid).toBe(false);
    expect(
      validateProfileInput({ ...validProfile, bio: ["x".repeat(1001)] }).valid,
    ).toBe(false);
    expect(
      validateProfileInput({ ...validProfile, bio: Array(11).fill("x") }).valid,
    ).toBe(false);
  });

  it("rejects a photo outside Vercel Blob", () => {
    expect(
      validateProfileInput({ ...validProfile, photoUrl: "https://example.com/a.jpg" }).valid,
    ).toBe(false);
  });

  it("rejects unknown icons, long labels and too many facts", () => {
    expect(
      validateProfileInput({ ...validProfile, facts: [{ label: "x", icon: "nope" }] }).valid,
    ).toBe(false);
    expect(
      validateProfileInput({
        ...validProfile,
        facts: [{ label: "x".repeat(61), icon: "pin" }],
      }).valid,
    ).toBe(false);
    expect(
      validateProfileInput({
        ...validProfile,
        facts: Array(13).fill({ label: "x", icon: "pin" }),
      }).valid,
    ).toBe(false);
  });

  it("rejects a missing body", () => {
    expect(validateProfileInput(null).valid).toBe(false);
  });
});

describe("sanitizeFacts", () => {
  it("keeps valid entries and drops the rest", () => {
    expect(
      sanitizeFacts([
        { label: "Austin", icon: "pin" },
        { label: "", icon: "pin" },
        { label: "Bad", icon: "rocket" },
        "junk",
        null,
      ]),
    ).toEqual([{ label: "Austin", icon: "pin" }]);
  });

  it("returns [] for non-arrays", () => {
    expect(sanitizeFacts(null)).toEqual([]);
    expect(sanitizeFacts({ label: "x" })).toEqual([]);
  });
});

describe("validateContactLinkInput", () => {
  const validLink = { label: " GitHub ", url: "https://github.com/me", icon: "github" };

  it("accepts and trims a valid link", () => {
    const result = validateContactLinkInput(validLink);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({
        label: "GitHub",
        url: "https://github.com/me",
        icon: "github",
      });
    }
  });

  it("accepts mailto links", () => {
    expect(
      validateContactLinkInput({ ...validLink, url: "mailto:me@example.com", icon: "email" })
        .valid,
    ).toBe(true);
  });

  it("rejects unsafe schemes", () => {
    for (const url of ["javascript:alert(1)", "http://github.com", "data:text/html,x"]) {
      expect(validateContactLinkInput({ ...validLink, url }).valid).toBe(false);
    }
  });

  it("rejects unknown icons and bad labels", () => {
    expect(validateContactLinkInput({ ...validLink, icon: "myspace" }).valid).toBe(false);
    expect(validateContactLinkInput({ ...validLink, label: "" }).valid).toBe(false);
    expect(validateContactLinkInput({ ...validLink, label: "x".repeat(41) }).valid).toBe(false);
  });

  it("keeps a valid order and rejects an invalid one", () => {
    const ok = validateContactLinkInput({ ...validLink, order: 3 });
    expect(ok.valid && ok.data.order).toBe(3);
    expect(validateContactLinkInput({ ...validLink, order: -1 }).valid).toBe(false);
  });
});

describe("validateReorderInput", () => {
  it("accepts unique positive integer ids", () => {
    const result = validateReorderInput({ ids: [3, 1, 2] });
    expect(result.valid && result.data.ids).toEqual([3, 1, 2]);
  });

  it("rejects empty, duplicate, non-integer and non-positive ids", () => {
    for (const ids of [[], [1, 1], [1.5], [0], ["1"], "1,2", Array(201).fill(0).map((_, i) => i + 1)]) {
      expect(validateReorderInput({ ids }).valid).toBe(false);
    }
    expect(validateReorderInput(null).valid).toBe(false);
  });
});
