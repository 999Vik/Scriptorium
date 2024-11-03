// pages/api/blogposts/[id]/comments/[commentedId].js

import prisma from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth';
import nextConnect from 'next-connect';

const handler = nextConnect();

// GET /api/blogposts/[id]/comments/[commentedId] - Fetch a specific comment
handler.get(async (req, res) => {
  const { id, commentedId } = req.query;
  const blogPostId = parseInt(id, 10);
  const commentId = parseInt(commentedId, 10);

  if (isNaN(blogPostId) || isNaN(commentId)) {
    return res.status(400).json({ error: 'Invalid blog post ID or comment ID.' });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!comment || comment.blogPostId !== blogPostId) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    res.status(200).json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/blogposts/[id]/comments/[commentedId] - Update a specific comment
handler.put(requireAuth(async (req, res) => {
  const { id, commentedId } = req.query;
  const blogPostId = parseInt(id, 10);
  const commentId = parseInt(commentedId, 10);
  const userId = req.user.id;

  if (isNaN(blogPostId) || isNaN(commentId)) {
    return res.status(400).json({ error: 'Invalid blog post ID or comment ID.' });
  }

  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Content is required and must be a non-empty string.' });
  }

  try {
    // Fetch the comment to verify existence and ownership
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment || existingComment.blogPostId !== blogPostId) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (existingComment.authorId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this comment.' });
    }

    // Update the comment
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}));

// DELETE /api/blogposts/[id]/comments/[commentedId] - Delete a specific comment
handler.delete(requireAuth(async (req, res) => {
  const { id, commentedId } = req.query;
  const blogPostId = parseInt(id, 10);
  const commentId = parseInt(commentedId, 10);
  const userId = req.user.id;

  if (isNaN(blogPostId) || isNaN(commentId)) {
    return res.status(400).json({ error: 'Invalid blog post ID or comment ID.' });
  }

  try {
    // Fetch the comment to verify existence and ownership
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment || existingComment.blogPostId !== blogPostId) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (existingComment.authorId !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment.' });
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.status(200).json({ message: 'Comment deleted successfully.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}));

export default handler;
