// pages/api/blog-posts/index.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create a new blog post
    const { title, description, content, tags } = req.body;

    // Validate required fields
    if (!title || !description || !content) {
      return res.status(400).json({ error: 'Title, description, and content are required' });
    }

    try {
      // Handle tags: connect existing or create new ones
      const tagOperations = tags?.map((tagName) => ({
        where: { name: tagName },
        create: { name: tagName },
      })) || [];

      const newBlogPost = await prisma.blogPost.create({
        data: {
          title,
          description,
          content,
          // Assigning to the default user with id: 1
          author: { connect: { id: 1 } },
          tags: {
            connectOrCreate: tagOperations,
          },
        },
        include: {
          tags: true,
          author: { select: { id, email, name } },
        },
      });

      return res.status(201).json(newBlogPost);
    } catch (error) {
      console.error('Error creating blog post:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Retrieve all blog posts with pagination and search
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
      const where = {
        AND: [
          { hidden: false }, // Exclude hidden blog posts
          {
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
          },
        ],
      };

      const [total, blogPosts] = await Promise.all([
        prisma.blogPost.count({ where }),
        prisma.blogPost.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id, email, name } },
            tags: { select: { name: true } },
          },
        }),
      ]);

      return res.status(200).json({
        data: blogPosts,
        meta: {
          total,
          page: parseInt(page),
          lastPage: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error retrieving blog posts:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
