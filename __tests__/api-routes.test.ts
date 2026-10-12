import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock Prisma ---
const prismaMock = vi.hoisted(() => {
  const crud = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
    delete: vi.fn().mockResolvedValue({}),
    aggregate: vi.fn().mockResolvedValue({ _max: { order: null } }),
  });
  const mock: Record<string, any> = {
    project: crud(),
    experience: crud(),
    contactLink: crud(),
    profile: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockImplementation(({ create }) =>
        Promise.resolve({ updatedAt: new Date(), ...create })
      ),
    },
  };
  // Interactive transactions run the callback against the same mock.
  mock.$transaction = vi.fn((fn: (tx: unknown) => unknown) => fn(mock));
  return mock;
});

vi.mock("lib/prisma", () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

// --- Mock iron-session ---
let mockSession: Record<string, unknown> = {};

vi.mock("iron-session", () => ({
  getIronSession: vi.fn().mockImplementation(() =>
    Promise.resolve({
      ...mockSession,
      save: vi.fn(),
      destroy: vi.fn(),
    })
  ),
}));

// --- Helpers ---

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: "GET",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    } as Record<string, string | string[] | undefined>,
    socket: { remoteAddress: `test-${Math.random()}` },
    body: {},
    query: {},
    ...overrides,
  } as any;
}

function mockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.revalidate = vi.fn().mockResolvedValue(undefined);
  // iron-session needs getHeader/setHeader on response
  res.getHeader = vi.fn();
  return res;
}

// --- Public API Route Tests ---

describe("GET /api/projects", () => {
  it("returns projects list", async () => {
    const { default: handler } = await import("../pages/api/projects");
    const req = mockReq({ method: "GET" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it("rejects non-GET methods", async () => {
    const { default: handler } = await import("../pages/api/projects");
    const req = mockReq({ method: "POST" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("GET /api/experience", () => {
  it("returns experience list", async () => {
    const { default: handler } = await import("../pages/api/experience");
    const req = mockReq({ method: "GET" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it("rejects non-GET methods", async () => {
    const { default: handler } = await import("../pages/api/experience");
    const req = mockReq({ method: "DELETE" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});

// --- Admin Route Tests ---

describe("POST /api/admin/login", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, ADMIN_PASSWORD: "test-secret-123" };
    delete process.env.ADMIN_PASSWORD_HASH;
    mockSession = {};
  });

  it("rejects non-POST methods", async () => {
    const { default: handler } = await import("../pages/api/admin/login");
    const req = mockReq({ method: "GET" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it("rejects missing password", async () => {
    const { default: handler } = await import("../pages/api/admin/login");
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: {},
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid password" });
  });

  it("rejects wrong password", async () => {
    const { default: handler } = await import("../pages/api/admin/login");
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: { password: "wrong" },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("accepts correct password", async () => {
    const { default: handler } = await import("../pages/api/admin/login");
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: { password: "test-secret-123" },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it("rejects request with no origin (CSRF)", async () => {
    const { default: handler } = await import("../pages/api/admin/login");
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000" },
      body: { password: "test-secret-123" },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 400 for a non-object body instead of throwing", async () => {
    const { default: handler } = await import("../pages/api/admin/login");
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: null,
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects a non-string password", async () => {
    const { default: handler } = await import("../pages/api/admin/login");
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: { password: { $ne: "" } },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("prefers ADMIN_PASSWORD_HASH when set", async () => {
    const { default: bcrypt } = await import("bcryptjs");
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync("hashed-secret", 4);
    const { default: handler } = await import("../pages/api/admin/login");

    const ok = mockRes();
    await handler(
      mockReq({
        method: "POST",
        headers: { host: "localhost:3000", origin: "http://localhost:3000" },
        body: { password: "hashed-secret" },
      }),
      ok
    );
    expect(ok.status).toHaveBeenCalledWith(200);

    // The plaintext ADMIN_PASSWORD no longer works once a hash is configured.
    const stale = mockRes();
    await handler(
      mockReq({
        method: "POST",
        headers: { host: "localhost:3000", origin: "http://localhost:3000" },
        body: { password: "test-secret-123" },
      }),
      stale
    );
    expect(stale.status).toHaveBeenCalledWith(401);
  });

  it("returns 429 after five failed attempts from one IP", async () => {
    const { default: handler } = await import("../pages/api/admin/login");
    const ip = `203.0.113.${Math.floor(Math.random() * 255)}`;
    const attempt = () =>
      mockReq({
        method: "POST",
        headers: {
          host: "localhost:3000",
          origin: "http://localhost:3000",
          "x-forwarded-for": ip,
        },
        body: { password: "wrong" },
      });

    for (let i = 0; i < 5; i++) {
      const res = mockRes();
      await handler(attempt(), res);
      expect(res.status).toHaveBeenCalledWith(401);
    }
    const res = mockRes();
    await handler(attempt(), res);
    expect(res.status).toHaveBeenCalledWith(429);
  });
});

describe("Admin projects routes", () => {
  beforeEach(() => {
    mockSession = { isAdmin: true };
  });

  it("rejects unauthenticated requests", async () => {
    mockSession = {};
    const { default: handler } = await import(
      "../pages/api/admin/projects/index"
    );
    const req = mockReq({ method: "GET" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("GET returns project list for authenticated admin", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/index"
    );
    const req = mockReq({ method: "GET" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("POST creates project with valid input", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/index"
    );
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: {
        img: "https://example.com/img.png",
        name: "Test Project",
        url: "https://example.com",
        githubUrl: "https://github.com/user/repo",
        body: ["Description"],
        tags: ["react"],
        order: 1,
      },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("POST rejects invalid input", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/index"
    );
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: { name: "Missing required fields" },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("POST rejects CSRF (wrong origin)", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/index"
    );
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "https://evil.com" },
      body: {
        img: "https://example.com/img.png",
        name: "Test",
        url: "https://example.com",
        githubUrl: "https://github.com/user/repo",
      },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("Admin projects [id] route", () => {
  beforeEach(() => {
    mockSession = { isAdmin: true };
  });

  it("rejects invalid id", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const req = mockReq({ method: "GET", query: { id: "abc" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid id" });
  });

  it("rejects negative id", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const req = mockReq({ method: "GET", query: { id: "-1" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("rejects ids with trailing garbage (parseInt would accept '1abc')", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const { prisma } = await import("lib/prisma");
    const req = mockReq({ method: "GET", query: { id: "1abc" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.project.findUnique).not.toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it("PUT returns 404 when the row is missing", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const { prisma } = await import("lib/prisma");
    (prisma.project.update as any).mockRejectedValueOnce(
      Object.assign(new Error("Record not found"), { code: "P2025" })
    );
    const req = mockReq({
      method: "PUT",
      query: { id: "999" },
      body: {
        img: "https://example.com/img.png",
        name: "Test",
        url: "https://example.com",
        githubUrl: "https://github.com/user/repo",
      },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("DELETE returns 404 when the row is missing", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const { prisma } = await import("lib/prisma");
    (prisma.project.delete as any).mockRejectedValueOnce(
      Object.assign(new Error("Record not found"), { code: "P2025" })
    );
    const req = mockReq({ method: "DELETE", query: { id: "999" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("DELETE returns 204 when the row exists", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const req = mockReq({ method: "DELETE", query: { id: "1" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("rejects id of 0", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const req = mockReq({ method: "GET", query: { id: "0" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 for non-existent project", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const req = mockReq({ method: "GET", query: { id: "999" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("DELETE requires CSRF check", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const req = mockReq({
      method: "DELETE",
      query: { id: "1" },
      headers: { host: "localhost:3000", origin: "https://evil.com" },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 405 for unsupported methods", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const req = mockReq({ method: "PATCH", query: { id: "1" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});

describe("Admin experiences routes", () => {
  beforeEach(() => {
    mockSession = { isAdmin: true };
  });

  it("rejects unauthenticated requests", async () => {
    mockSession = {};
    const { default: handler } = await import(
      "../pages/api/admin/experiences/index"
    );
    const req = mockReq({ method: "GET" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("POST creates experience with valid input", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/experiences/index"
    );
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: {
        img: "https://example.com/logo.png",
        url: "https://example.com",
        position: "Engineer",
        timeCommitment: "Full-time",
        body: ["Did things"],
        tags: ["react"],
        order: 0,
      },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("POST rejects invalid experience input", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/experiences/index"
    );
    const req = mockReq({
      method: "POST",
      headers: { host: "localhost:3000", origin: "http://localhost:3000" },
      body: { position: "Only position" },
    });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// --- Inline admin API ---

const ORIGIN_HEADERS = { host: "localhost:3000", origin: "http://localhost:3000" };
const EVIL_HEADERS = { host: "localhost:3000", origin: "https://evil.com" };

const VALID_PROJECT = {
  img: "https://example.com/img.png",
  name: "Test Project",
  url: "https://example.com",
  githubUrl: "https://github.com/user/repo",
  body: ["Description"],
  tags: ["react"],
};

const VALID_PROFILE = {
  bio: ["Hello there."],
  photoUrl: "https://abc.public.blob.vercel-storage.com/images/me.jpg",
  facts: [{ label: "Austin, TX", icon: "pin" }],
};

const VALID_LINK = {
  label: "GitHub",
  url: "https://github.com/someone",
  icon: "github",
};

describe("GET /api/admin/session", () => {
  it("reports isAdmin true for an admin session, uncached", async () => {
    mockSession = { isAdmin: true };
    const { default: handler } = await import("../pages/api/admin/session");
    const res = mockRes();

    await handler(mockReq({ method: "GET" }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ isAdmin: true });
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });

  it("reports isAdmin false (still 200) without a session", async () => {
    mockSession = {};
    const { default: handler } = await import("../pages/api/admin/session");
    const res = mockRes();

    await handler(mockReq({ method: "GET" }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ isAdmin: false });
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });

  it("rejects other methods with an Allow header", async () => {
    const { default: handler } = await import("../pages/api/admin/session");
    const res = mockRes();

    await handler(mockReq({ method: "POST", headers: ORIGIN_HEADERS }), res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "GET");
  });
});

describe("/api/admin/profile", () => {
  beforeEach(() => {
    mockSession = { isAdmin: true };
    prismaMock.profile.upsert.mockClear();
  });

  it("GET returns the defaults with isDefault when there is no row", async () => {
    const { default: handler } = await import("../pages/api/admin/profile");
    const { DEFAULT_PROFILE } = await import("lib/content/defaults");
    const res = mockRes();

    await handler(mockReq({ method: "GET" }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      profile: DEFAULT_PROFILE,
      isDefault: true,
    });
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });

  it("rejects unauthenticated requests", async () => {
    mockSession = {};
    const { default: handler } = await import("../pages/api/admin/profile");
    const res = mockRes();

    await handler(
      mockReq({ method: "PUT", headers: ORIGIN_HEADERS, body: VALID_PROFILE }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(prismaMock.profile.upsert).not.toHaveBeenCalled();
  });

  it("PUT rejects CSRF (wrong origin)", async () => {
    const { default: handler } = await import("../pages/api/admin/profile");
    const res = mockRes();

    await handler(
      mockReq({ method: "PUT", headers: EVIL_HEADERS, body: VALID_PROFILE }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prismaMock.profile.upsert).not.toHaveBeenCalled();
  });

  it("PUT rejects invalid input", async () => {
    const { default: handler } = await import("../pages/api/admin/profile");
    const res = mockRes();

    await handler(
      mockReq({
        method: "PUT",
        headers: ORIGIN_HEADERS,
        body: { ...VALID_PROFILE, photoUrl: "https://evil.com/x.jpg" },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.profile.upsert).not.toHaveBeenCalled();
  });

  it("PUT upserts row 1 and revalidates the homepage", async () => {
    const { default: handler } = await import("../pages/api/admin/profile");
    const res = mockRes();

    await handler(
      mockReq({ method: "PUT", headers: ORIGIN_HEADERS, body: VALID_PROFILE }),
      res
    );

    expect(prismaMock.profile.upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      create: { id: 1, ...VALID_PROFILE },
      update: VALID_PROFILE,
    });
    expect(res.revalidate).toHaveBeenCalledWith("/");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ profile: VALID_PROFILE });
  });

  it("a failed revalidate does not fail the request", async () => {
    const { default: handler } = await import("../pages/api/admin/profile");
    const res = mockRes();
    res.revalidate.mockRejectedValueOnce(new Error("no ISR in dev"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handler(
      mockReq({ method: "PUT", headers: ORIGIN_HEADERS, body: VALID_PROFILE }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("/api/admin/contact-links", () => {
  beforeEach(() => {
    mockSession = { isAdmin: true };
    prismaMock.contactLink.create.mockClear();
    prismaMock.contactLink.update.mockClear();
  });

  it("rejects unauthenticated requests", async () => {
    mockSession = {};
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/index"
    );
    const res = mockRes();

    await handler(mockReq({ method: "GET" }), res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("GET lists links by order", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/index"
    );
    const res = mockRes();

    await handler(mockReq({ method: "GET" }), res);

    expect(prismaMock.contactLink.findMany).toHaveBeenCalledWith({
      orderBy: { order: "asc" },
    });
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });

  it("POST rejects CSRF (wrong origin)", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/index"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: EVIL_HEADERS, body: VALID_LINK }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("POST rejects a javascript: url", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/index"
    );
    const res = mockRes();

    await handler(
      mockReq({
        method: "POST",
        headers: ORIGIN_HEADERS,
        body: { ...VALID_LINK, url: "javascript:alert(1)" },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.contactLink.create).not.toHaveBeenCalled();
  });

  it("POST appends at the end and revalidates", async () => {
    prismaMock.contactLink.aggregate.mockResolvedValueOnce({ _max: { order: 3 } });
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/index"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: ORIGIN_HEADERS, body: VALID_LINK }),
      res
    );

    expect(prismaMock.contactLink.create).toHaveBeenCalledWith({
      data: { ...VALID_LINK, order: 4 },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.revalidate).toHaveBeenCalledWith("/");
  });

  it("PUT updates and revalidates", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/[id]"
    );
    const res = mockRes();

    await handler(
      mockReq({
        method: "PUT",
        query: { id: "2" },
        headers: ORIGIN_HEADERS,
        body: VALID_LINK,
      }),
      res
    );

    expect(prismaMock.contactLink.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: VALID_LINK,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.revalidate).toHaveBeenCalledWith("/");
  });

  it("PUT returns 404 when the row is missing", async () => {
    prismaMock.contactLink.update.mockRejectedValueOnce(
      Object.assign(new Error("Record not found"), { code: "P2025" })
    );
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/[id]"
    );
    const res = mockRes();

    await handler(
      mockReq({
        method: "PUT",
        query: { id: "999" },
        headers: ORIGIN_HEADERS,
        body: VALID_LINK,
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.revalidate).not.toHaveBeenCalled();
  });

  it("DELETE returns 204 and revalidates", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/[id]"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "DELETE", query: { id: "1" }, headers: ORIGIN_HEADERS }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.revalidate).toHaveBeenCalledWith("/");
  });

  it("DELETE returns 404 when the row is missing", async () => {
    prismaMock.contactLink.delete.mockRejectedValueOnce(
      Object.assign(new Error("Record not found"), { code: "P2025" })
    );
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/[id]"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "DELETE", query: { id: "999" }, headers: ORIGIN_HEADERS }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("DELETE requires CSRF check", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/[id]"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "DELETE", query: { id: "1" }, headers: EVIL_HEADERS }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe("POST /api/admin/{kind}/reorder", () => {
  beforeEach(() => {
    mockSession = { isAdmin: true };
    prismaMock.project.update.mockClear();
    prismaMock.contactLink.update.mockClear();
    prismaMock.$transaction.mockClear();
  });

  it("rejects non-POST methods with an Allow header", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/reorder"
    );
    const res = mockRes();

    await handler(mockReq({ method: "GET" }), res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
  });

  it("rejects unauthenticated requests", async () => {
    mockSession = {};
    const { default: handler } = await import(
      "../pages/api/admin/projects/reorder"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: ORIGIN_HEADERS, body: { ids: [1] } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects CSRF (wrong origin)", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/reorder"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: EVIL_HEADERS, body: { ids: [1] } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects duplicate ids", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/reorder"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: ORIGIN_HEADERS, body: { ids: [1, 1] } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 409 when the id set no longer matches the table", async () => {
    prismaMock.project.findMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const { default: handler } = await import(
      "../pages/api/admin/projects/reorder"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: ORIGIN_HEADERS, body: { ids: [2, 1] } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "Items changed; reload and try again",
    });
    expect(prismaMock.project.update).not.toHaveBeenCalled();
  });

  it("writes each row's order as its index", async () => {
    prismaMock.project.findMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const { default: handler } = await import(
      "../pages/api/admin/projects/reorder"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: ORIGIN_HEADERS, body: { ids: [3, 1, 2] } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
    expect(prismaMock.project.update.mock.calls.map(([args]: any[]) => args)).toEqual([
      { where: { id: 3 }, data: { order: 0 } },
      { where: { id: 1 }, data: { order: 1 } },
      { where: { id: 2 }, data: { order: 2 } },
    ]);
    // Projects are fetched client-side, so there is no page to revalidate.
    expect(res.revalidate).not.toHaveBeenCalled();
  });

  it("contact-links reorder revalidates the homepage", async () => {
    prismaMock.contactLink.findMany.mockResolvedValueOnce([{ id: 4 }, { id: 5 }]);
    const { default: handler } = await import(
      "../pages/api/admin/contact-links/reorder"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: ORIGIN_HEADERS, body: { ids: [5, 4] } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(prismaMock.contactLink.update).toHaveBeenCalledTimes(2);
    expect(res.revalidate).toHaveBeenCalledWith("/");
  });
});

describe("Admin ordering on create and update", () => {
  beforeEach(() => {
    mockSession = { isAdmin: true };
    prismaMock.project.create.mockClear();
    prismaMock.project.update.mockClear();
  });

  it("POST appends a project after the current max order", async () => {
    prismaMock.project.aggregate.mockResolvedValueOnce({ _max: { order: 7 } });
    const { default: handler } = await import(
      "../pages/api/admin/projects/index"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: ORIGIN_HEADERS, body: VALID_PROJECT }),
      res
    );

    expect(prismaMock.project.create).toHaveBeenCalledWith({
      data: { ...VALID_PROJECT, order: 8 },
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("POST starts at 0 on an empty table", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/index"
    );
    const res = mockRes();

    await handler(
      mockReq({ method: "POST", headers: ORIGIN_HEADERS, body: VALID_PROJECT }),
      res
    );

    expect(prismaMock.project.create).toHaveBeenCalledWith({
      data: { ...VALID_PROJECT, order: 0 },
    });
  });

  it("PUT without order leaves order out of the update", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/[id]"
    );
    const res = mockRes();

    await handler(
      mockReq({
        method: "PUT",
        query: { id: "1" },
        headers: ORIGIN_HEADERS,
        body: VALID_PROJECT,
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
    const [{ data }] = prismaMock.project.update.mock.calls[0];
    expect(data).not.toHaveProperty("order");
    expect(data).toEqual(VALID_PROJECT);
  });

  it("admin responses are marked uncacheable", async () => {
    const { default: handler } = await import(
      "../pages/api/admin/projects/index"
    );
    const res = mockRes();

    await handler(mockReq({ method: "GET" }), res);

    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  });
});
