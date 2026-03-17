import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  rateLimit,
  validateOrigin,
  csrfCheck,
  validateProjectInput,
  validateExperienceInput,
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

  it("allows requests under the limit", () => {
    const req = mockReq({
      socket: { remoteAddress: `10.0.0.${Math.random()}` },
    });
    expect(rateLimit(req, { maxAttempts: 3, windowMs: 60000 })).toBe(false);
    expect(rateLimit(req, { maxAttempts: 3, windowMs: 60000 })).toBe(false);
    expect(rateLimit(req, { maxAttempts: 3, windowMs: 60000 })).toBe(false);
  });

  it("blocks requests over the limit", () => {
    const ip = `10.1.0.${Math.random()}`;
    const req = mockReq({ socket: { remoteAddress: ip } });
    const opts = { maxAttempts: 2, windowMs: 60000 };

    expect(rateLimit(req, opts)).toBe(false); // 1
    expect(rateLimit(req, opts)).toBe(false); // 2
    expect(rateLimit(req, opts)).toBe(true); // 3 -> blocked
  });

  it("uses x-forwarded-for header when available", () => {
    const ip = `10.2.0.${Math.random()}`;
    const req = mockReq({
      headers: { "x-forwarded-for": ip },
      socket: { remoteAddress: "different-ip" },
    });
    const opts = { maxAttempts: 1, windowMs: 60000 };

    expect(rateLimit(req, opts)).toBe(false); // 1
    expect(rateLimit(req, opts)).toBe(true); // blocked
  });

  it("takes first IP from x-forwarded-for chain", () => {
    const ip = `10.3.0.${Math.random()}`;
    const req = mockReq({
      headers: { "x-forwarded-for": `${ip}, 192.168.1.1, 10.0.0.1` },
      socket: { remoteAddress: "fallback" },
    });
    const opts = { maxAttempts: 1, windowMs: 60000 };

    expect(rateLimit(req, opts)).toBe(false);
    expect(rateLimit(req, opts)).toBe(true);
  });

  it("defaults to 5 max attempts", () => {
    const ip = `10.4.0.${Math.random()}`;
    const req = mockReq({ socket: { remoteAddress: ip } });

    for (let i = 0; i < 5; i++) {
      expect(rateLimit(req)).toBe(false);
    }
    expect(rateLimit(req)).toBe(true);
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

  it("defaults order to 0", () => {
    const result = validateProjectInput({
      ...validProject,
      order: undefined,
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.order).toBe(0);
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

  it("defaults body, tags, and order", () => {
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
      expect(result.data.order).toBe(0);
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
