// pages/api/[id]/comments/index.js

import prisma from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';
import nextConnect from 'next-connect';
import * as Yup from 'yup';

const handler = nextConnect();

// Validation schema for creating a comment
const createCommentSchema = Yup.object().shape({
  content: Yup.string().trim().required('Content is required').max(1000),
  parentId: Yup.number().integer().nullable(), // For nested comments
});

// POST /api/[id]/comments - Create a new comment
handler.post(requireAuth(async (req, res) => {
  const { id } = req.query; // `id` corresponds to blog post ID
  console.log('Received postId:', id);
  const blogPostId = parseInt(id, 10);
  const userId = req.user.id;
  console.log('Parsed blogPostId:', blogPostId);

  if (isNaN(blogPostId)) {
    return res.status(400).json({ error: 'Invalid blog post ID.' });
  }

  try {
    // Validate request body
    const validatedData = await createCommentSchema.validate(req.body, { stripUnknown: true });
    const { content, parentId } = validatedData;
    console.log('Validated data:', validatedData);

    // Check if the blog post exists and is not hidden
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
    });
    console.log('Fetched blogPost:', blogPost);

    if (!blogPost || blogPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    // If parentId is provided, verify the parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      console.log('Fetched parentComment:', parentComment);
      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found.' });
      }
    }

    // Create the comment
    const newComment = await prisma.comment.create({
      data: {
        content,
        author: { connect: { id: userId } },
        blogPost: { connect: { id: blogPostId } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        replies: {
          include: { author: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    console.log('Created new comment:', newComment);
    return res.status(201).json(newComment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.log('Validation error:', error.message);
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating comment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}));

// GET /api/[id]/comments - Fetch comments for a blog post
handler.get(async (req, res) => {
  const { id } = req.query; // `id` corresponds to blog post ID
  const blogPostId = parseInt(id, 10);
  console.log('Fetching comments for blogPostId:', blogPostId);

  if (isNaN(blogPostId)) {
    return res.status(400).json({ error: 'Invalid blog post ID.' });
  }

  try {
    // Check if the blog post exists and is not hidden
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
    });
    console.log('Fetched blogPost:', blogPost);

    if (!blogPost || blogPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    // Fetch top-level comments with their replies
    const comments = await prisma.comment.findMany({
      where: { blogPostId: blogPostId, parentId: null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        replies: {
          include: { author: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log('Fetched comments:', comments);
    return res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default handler; // Ensure only one default export
