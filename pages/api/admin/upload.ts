import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getIronSession } from "iron-session";
import type { NextApiRequest, NextApiResponse } from "next";
import { sessionOptions, type SessionData } from "../../../lib/session";
import { csrfCheck } from "../../../lib/security";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (csrfCheck(req, res)) return;

  try {
    const jsonResponse = await handleUpload({
      body: req.body as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        maximumSizeInBytes: 5 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    });
    return res.json(jsonResponse);
  } catch {
    return res.status(400).json({ error: "Upload failed" });
  }
}
