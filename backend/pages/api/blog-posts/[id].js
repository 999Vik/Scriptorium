// pages/api/blog-posts/[id].js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return handleGET(req, res, id);
  } else if (req.method === 'PUT') {
    return handlePUT(req, res, id);
  } else if (req.method === 'DELETE') {
    return handleDELETE(req, res, id);
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// GET /api/blog-posts/[id]
async function handleGET(req, res, id) {
  try {
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
      },
    });

    if (!blogPost || blogPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    return res.status(200).json(blogPost);
  } catch (error) {
    console.error('Error retrieving blog post:', error);
    console.error('Error details:', JSON.stringify(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/blog-posts/[id]
async function handlePUT(req, res, id) {
  const { title, description, content, tags } = req.body;

  try {
    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost || existingPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Handle tags: clear existing tags and connect/create new ones
    const tagConnectOrCreate = tags?.map((tag) => ({
      where: { name: tag },
      create: { name: tag },
    })) || [];

    const updatedPost = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: {
        title: title ?? existingPost.title,
        description: description ?? existingPost.description,
        content: content ?? existingPost.content,
        tags: {
          set: [], // Remove existing tags
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
      },
    });

    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    console.error('Error details:', JSON.stringify(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/blog-posts/[id]
async function handleDELETE(req, res, id) {
  try {
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPost || existingPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Soft delete by setting hidden to true
    await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: { hidden: true },
    });

    return res.status(200).json({ message: 'Blog post hidden successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    console.error('Error details:', JSON.stringify(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}
