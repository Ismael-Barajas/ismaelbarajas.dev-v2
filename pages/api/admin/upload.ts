import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getIronSession } from "iron-session";
import type { NextApiRequest, NextApiResponse } from "next";
import { sessionOptions, type SessionData } from "../../../lib/session";
import { csrfCheck } from "../../../lib/security";

/** Blob keys admins may write. Matches the prefix used by ImageUpload. */
export const UPLOAD_PREFIX = "images/";

const SAFE_PATHNAME = /^images\/[A-Za-z0-9 ._()-]{1,200}$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (csrfCheck(req, res)) return;

  try {
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(UPLOAD_PREFIX) || !SAFE_PATHNAME.test(pathname)) {
          throw new Error("Uploads must be image files under images/");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return res.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return res.status(400).json({ error: message });
  }
}
