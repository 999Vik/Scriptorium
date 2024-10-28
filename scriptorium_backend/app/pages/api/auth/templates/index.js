import { authenticateToken } from '../../../middleware/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Authenticate the user
    authenticateToken(req, res, async () => {
      const { title, explanation, tags, code, language } = req.body;
      const { userId } = req.user;

      // Validate input
      if (!title || !code || !language) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        const newTemplate = await prisma.codeTemplate.create({
          data: {
            title,
            explanation,
            tags,
            code,
            language,
            author: { connect: { id: userId } },
          },
        });
        res.status(201).json(newTemplate);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create code template' });
      }
    });
  } else if (req.method === 'GET') {
    // Implement search and pagination
    const { search, page = 1, limit = 10 } = req.query;

    try {
      const templates = await prisma.codeTemplate.findMany({
        where: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { tags: { has: search } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      });
      res.status(200).json(templates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve code templates' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
