// pages/api/templates/index.js

import prisma from '../../../lib/prisma';
import { authenticateToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle creating a new code template
    // Ensure that the user is authenticated
    const decoded = authenticateToken(req, res);
    if (!decoded) return;

    const { title, explanation, tagNames, code, language } = req.body;

    // Validate required fields
    if (!title || !code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Handle tags: create if they don't exist
      let tags = [];
      if (tagNames && tagNames.length > 0) {
        tags = await Promise.all(
          tagNames.map(async (name) => {
            const existingTag = await prisma.tag.findUnique({ where: { name } });
            if (existingTag) return existingTag;
            return await prisma.tag.create({ data: { name } });
          })
        );
      }

      // Create the code template
      const newTemplate = await prisma.codeTemplate.create({
        data: {
          title,
          explanation: explanation || '',
          code,
          language,
          author: { connect: { id: decoded.userId } },
          codeTemplateTags: {
            create: tags.map(tag => ({
              tag: { connect: { id: tag.id } },
            })),
          },
        },
      });

      res.status(201).json(newTemplate);
    } catch (error) {
      console.error('Error creating code template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Handle fetching code templates with pagination and search
    const { search = '', page = 1, limit = 10 } = req.query;

    try {
      const templates = await prisma.codeTemplate.findMany({
        where: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            {
              codeTemplateTags: {
                some: {
                  tag: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          codeTemplateTags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // Format the response to include tags directly
      const formattedTemplates = templates.map(template => ({
        ...template,
        tags: template.codeTemplateTags.map(ctt => ctt.tag),
      }));

      res.status(200).json(formattedTemplates);
    } catch (error) {
      console.error('Error fetching code templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
