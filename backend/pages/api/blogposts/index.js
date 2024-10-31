// pages/api/blog-posts/index.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Handle GET request: Retrieve all blog posts
    try {
      const blogPosts = await prisma.blogPost.findMany({
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(blogPosts);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    // Handle POST request: Create a new blog post
    const { title, description, content, tags, authorId } = req.body;

    // Validate required fields
    if (!title || !description || !content || !authorId) {
      return res.status(400).json({ error: 'Title, description, content, and authorId are required' });
    }

    try {
      // Create or connect tags
      const tagConnectOrCreate = tags?.map((tag) => ({
        where: { name: tag },
        create: { name: tag },
      })) || [];

      // Create the blog post
      const newBlogPost = await prisma.blogPost.create({
        data: {
          title,
          description,
          content,
          author: { connect: { id: authorId } },
          tags: {
            connectOrCreate: tagConnectOrCreate,
          },
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          tags: true,
        },
      });

      res.status(201).json(newBlogPost);
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    // Method Not Allowed
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
