// pages/api/templates/[id]/fork.js

import prisma from "../../../../lib/prisma";
import nextConnect from "next-connect";
import { authenticateToken } from "../../../../lib/auth";

const handler = nextConnect();

handler.post(async (req, res) => {
  const { id } = req.query;
  const { title, explanation, code, language, tags } = req.body;
  let user = null;

  const authResult = await authenticateToken(req);
  if (!authResult.error) {
    user = authResult.user;
  }

  try {
    const originalTemplate = await prisma.codeTemplate.findUnique({
      where: { id: parseInt(id, 10) },
      include: { tags: true },
    });

    if (!originalTemplate) {
      return res.status(404).json({ error: "Original template not found" });
    }

    const tagsArray = tags
      ? Array.isArray(tags)
        ? tags
        : [tags]
      : originalTemplate.tags.map((t) => t.name);

    const processedTags = await Promise.all(
      tagsArray.map(async (tagName) => {
        const formattedTag = tagName.trim().toLowerCase();
        let tag = await prisma.tag.findUnique({
          where: { name: formattedTag },
        });
        if (!tag) {
          tag = await prisma.tag.create({ data: { name: formattedTag } });
        }
        return { id: tag.id };
      })
    );

    const forkedTemplate = await prisma.codeTemplate.create({
      data: {
        title: title || `${originalTemplate.title} (Forked)`,
        explanation: explanation || originalTemplate.explanation,
        code: code || originalTemplate.code,
        language: language || originalTemplate.language,
        forkedFrom: { connect: { id: originalTemplate.id } },
        author: user ? { connect: { id: user.id } } : undefined,
        tags: {
          connect: processedTags,
        },
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        tags: true,
        forkedFrom: {
          select: { id: true, title: true },
        },
      },
    });

    res.status(201).json(forkedTemplate);
  } catch (error) {
    console.error("Error forking template:", error);
    res.status(500).json({ error: "Error forking template" });
  }
});

export default handler;
