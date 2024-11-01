import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import nextConnect from "next-connect";

const handler = nextConnect();

handler.get(async (req, res) => {
  try {
    const { search, tags } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { explanation: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tags) {
      where.tags = {
        hasSome: tags.split(","),
      };
    }

    const templates = await prisma.template.findMany({
      where,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(templates);
  } catch (error) {
    console.error("Error fetching templates", error);
    res.status(500).json({ error: "Error fetching templates" });
  }
});

// handler.post(requireAuth, async (req, res) => {
