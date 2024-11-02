// pages/api/templates/[id].js

import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import nextConnect from "next-connect";

const handler = nextConnect();

handler.get(async (req, res) => {
  const { id } = req.query;

  try {
    const template = await prisma.template.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        forkedFrom: {
          select: { id: true, title },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.status(200).json(template);
  } catch (error) {
    console.error("Error fetching template", error);
    res.status(500).json({ error: "Error fetching template" });
  }
});

handler.put(
  requireAuth(async (req, res) => {
    const { id } = req.query;
    const { title, explanation, code, tags } = req.body;
    const { user } = req;
    const user_id = user.id;

    console.log("user_id", user_id);

    try {
      const template = await prisma.codeTemplate.findUnique({
        where: { id: parseInt(id) },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      if (template.authorId !== user.id) {
        return res.status(403).json({ error: "Forbidden: Not the author" });
      }

      const updatedTemplate = await prisma.codeTemplate.update({
        where: { id: parseInt(id) },
        data: {
          title,
          explanation,
          code,
          tags,
        },
      });

      res.status(200).json(updatedTemplate);
    } catch (error) {
      console.error("Error updating template", error);
      res.status(500).json({ error: "Error updating template" });
    }
  })
);

handler.delete(
  requireAuth(async (req, res) => {
    const { id } = req.query;
    const { user } = req;

    try {
      const template = await prisma.codeTemplate.findUnique({
        where: { id: parseInt(id) },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      if (template.authorId !== user.id) {
        return res.status(403).json({ error: "Forbidden: Not the author" });
      }

      await prisma.codeTemplate.delete({
        where: { id: parseInt(id) },
      });

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting template", error);
      res.status(500).json({ error: "Error deleting template" });
    }
  })
);

export default handler;
