import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "lib/prisma";

export default async function projects(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const items = await prisma.project.findMany({
      select: {
        img: true,
        name: true,
        url: true,
        githubUrl: true,
        body: true,
        tags: true,
      },
      orderBy: { order: "asc" },
    });

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=30"
    );

    return res.status(200).json({ items });
  } catch {
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
}
