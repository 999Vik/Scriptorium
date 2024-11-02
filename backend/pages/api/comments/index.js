// pages/api/comments/index.js

import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { content, userId, blogPostId, parentId } = req.body;

    // Validate that required fields are present
    if (!content || !userId || !blogPostId) {
      return res.status(400).json({ error: 'Content, userId, and blogPostId are required.' });
    }

    try {
      // Check if the user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Check if the blog post exists
      const blogPost = await prisma.blogPost.findUnique({ where: { id: blogPostId } });
      if (!blogPost) {
        return res.status(404).json({ error: 'Blog post not found.' });
      }

      // Create a new comment
      const newComment = await prisma.comment.create({
        data: {
          content,
          authorId: userId,
          blogPostId: blogPostId,
          parentId: parentId || null, // Set parentId as null if not provided
        },
      });

      return res.status(201).json(newComment);
    } catch (error) {
      console.error('Error creating comment:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'GET') {
    const { blogPostId } = req.query;

    // Validate the blogPostId query parameter
    if (!blogPostId) {
      return res.status(400).json({ error: 'The blogPostId query parameter is required.' });
    }

    try {
      // Retrieve all top-level comments for the specified blog post
      const comments = await prisma.comment.findMany({
        where: { blogPostId: parseInt(blogPostId, 10), parentId: null },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          replies: {
            include: { author: { select: { id: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return res.status(200).json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // If the method is not supported, return a 405 error
  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
