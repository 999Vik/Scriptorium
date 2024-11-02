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

    const templates = await prisma.codeTemplate.findMany({
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

handler.post(
  requireAuth(async (req, res) => {
    try {
      const { title, explanation, language, code, tags } = req.body;
      const { user } = req;

      if (!title || !code || !language || !explanation) {
        return res.status(400).json({
          error: "Please fill all required fields: ",
        });
      }

      const tagsArray = Array.isArray(tags) ? tags : [tags];

      const processedTags = await Promise.all(
        tagsArray.map(async (tagName) => {
          const formattedTag = tagName.trim().toLowerCase();
          let tag = await prisma.tag.findUnique({
            where: { name: formattedTag },
          });
          if (!tag) {
            tag = await prisma.tag.create({
              data: { name: formattedTag },
            });
          }
          return { id: tag.id };
        })
      );

      const template = await prisma.codeTemplate.create({
        data: {
          title,
          explanation,
          code,
          language,
          tags: {
            connect: processedTags,
          },
          author: { connect: { id: user.id } },
        },
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template", error);
      res.status(500).json({ error: "Error creating template" });
    }
  })
);

export default handler;
