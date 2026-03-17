import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mock Prisma ---
vi.mock("lib/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
      delete: vi.fn().mockResolvedValue({}),
    },
    experience: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
      delete: vi.fn().mockResolvedValue({}),
    },
  },
  default: {},
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
