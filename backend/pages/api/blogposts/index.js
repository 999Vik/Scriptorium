// pages/api/blog-posts/index.js

import { authenticate } from '../../../middleware/auth';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await authenticate(req, res, async () => {
      const { title, description, content, tags } = req.body;

      if (!title || !description || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Ensure tags is an array
        const tagsArray = Array.isArray(tags) ? tags : [];

        // Handle tags: Find existing tags or create new ones
        const tagConnectOrCreate = tagsArray.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        }));

        const blogPost = await prisma.blogPost.create({
          data: {
            title,
            description,
            content,
            tags: {
              connectOrCreate: tagConnectOrCreate,
            },
            authorId: req.user.id,
          },
          include: {
            tags: true,
            author: { select: { id, firstName, lastName } },
          },
        });
        return res.status(201).json(blogPost);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  } else if (req.method === 'GET') {
    // Handle GET request for listing blog posts
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    try {
      const where = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          {
            tags: {
              some: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      };

      const [total, blogPosts] = await Promise.all([
        prisma.blogPost.count({ where }),
        prisma.blogPost.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id, firstName, lastName } },
            tags: { select: { name: true } },
          },
        }),
      ]);

      return res.status(200).json({
        data: blogPosts,
        meta: {
          total,
          page,
          lastPage: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
