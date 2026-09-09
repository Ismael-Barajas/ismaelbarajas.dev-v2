import { describe, it, expect, vi, beforeEach } from "vitest";

let mockSession: Record<string, unknown> = {};
vi.mock("iron-session", () => ({
  getIronSession: vi.fn().mockImplementation(() =>
    Promise.resolve({ ...mockSession, save: vi.fn(), destroy: vi.fn() }),
  ),
}));

// Capture the options passed to handleUpload so the token callback can be
// exercised directly without talking to Vercel Blob.
const handleUploadMock = vi.fn();
vi.mock("@vercel/blob/client", () => ({
  handleUpload: (opts: unknown) => handleUploadMock(opts),
}));

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
    } as Record<string, string | undefined>,
    socket: { remoteAddress: "127.0.0.1" },
    body: { type: "blob.generate-client-token", payload: {} },
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
  res.getHeader = vi.fn();
  return res;
}

describe("POST /api/admin/upload", () => {
  beforeEach(() => {
    mockSession = { isAdmin: true };
    handleUploadMock.mockReset();
    handleUploadMock.mockResolvedValue({ type: "blob.generate-client-token", clientToken: "t" });
  });

  it("rejects non-POST methods before touching the session", async () => {
    const { default: handler } = await import("../pages/api/admin/upload");
    const res = mockRes();
    await handler(mockReq({ method: "GET" }), res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(handleUploadMock).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    mockSession = {};
    const { default: handler } = await import("../pages/api/admin/upload");
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(handleUploadMock).not.toHaveBeenCalled();
  });

  it("rejects cross-site origins", async () => {
    const { default: handler } = await import("../pages/api/admin/upload");
    const res = mockRes();
    await handler(
      mockReq({ headers: { host: "localhost:3000", origin: "https://evil.com" } }),
      res,
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(handleUploadMock).not.toHaveBeenCalled();
  });

  it("issues tokens only for images/ keys with safe names", async () => {
    const { default: handler } = await import("../pages/api/admin/upload");
    await handler(mockReq(), mockRes());

    const { onBeforeGenerateToken } = handleUploadMock.mock.calls[0][0];

    const ok = await onBeforeGenerateToken("images/logo.png");
    expect(ok.allowedContentTypes).toEqual([
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]);
    expect(ok.maximumSizeInBytes).toBe(5 * 1024 * 1024);

    await expect(onBeforeGenerateToken("avatars/x.png")).rejects.toThrow(/images\//);
    await expect(onBeforeGenerateToken("images/../secret.png")).rejects.toThrow();
    await expect(onBeforeGenerateToken("images/nested/x.png")).rejects.toThrow();
    await expect(onBeforeGenerateToken("images/")).rejects.toThrow();
  });

  it("returns 400 with the reason when token generation is refused", async () => {
    handleUploadMock.mockRejectedValueOnce(new Error("Uploads must be image files under images/"));
    const { default: handler } = await import("../pages/api/admin/upload");
    const res = mockRes();
    await handler(mockReq(), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Uploads must be image files under images/",
    });
  });
});
