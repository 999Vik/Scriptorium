import prisma from '../../../lib/prisma';
import * as Yup from 'yup';
import { requireAuth } from "../../../lib/auth";
import nextConnect from 'next-connect';

// Define schema for input validation (remove authorId)
const updateBlogPostSchema = Yup.object().shape({
  title: Yup.string().trim().max(200),
  description: Yup.string().trim().max(1000),
  content: Yup.string().trim(),
  tags: Yup.array().of(Yup.string().trim().max(50)),
  templateIds: Yup.array().of(Yup.number().integer()),
});

// Initialize NextConnect handler
const handler = nextConnect();

// GET /api/blog-posts/[id] - Public route
handler.get(async (req, res) => {
  const { id } = req.query;
  const blogPostId = parseInt(id, 10);

  if (isNaN(blogPostId)) {
    return res.status(400).json({ error: 'Invalid blog post ID' });
  }

  try {
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
        templates: true,
      },
    });

    if (!blogPost || blogPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.status(200).json({
      ...blogPost,
      rating: blogPost.upvotes - blogPost.downvotes,
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/blog-posts/[id] - Protected route (only by the creator or admin)
handler.put(requireAuth(async (req, res) => {
  const { id } = req.query;
  const blogPostId = parseInt(id, 10);

  if (isNaN(blogPostId)) {
    return res.status(400).json({ error: 'Invalid blog post ID' });
  }

  try {
    // Validate request body
    const validated = await updateBlogPostSchema.validate(req.body, { stripUnknown: true });
    const { title, description, content, tags, templateIds } = validated;

    // Check if blog post exists and is not hidden
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
    });

    if (!existingPost || existingPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if the authenticated user is the author or an admin
    if (existingPost.authorId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to update this blog post' });
    }

    // Prepare data for update
    const data = {};

    if (title) data.title = title;
    if (description) data.description = description;
    if (content) data.content = content;

    if (tags) {
      data.tags = {
        set: [], // Remove existing tags
        connectOrCreate: tags.map(tag => ({
          where: { name: tag },
          create: { name: tag },
        })),
      };
    }

    if (templateIds) {
      data.templates = {
        set: [], // Remove existing template links
        connect: templateIds.map(id => ({ id })),
      };
    }

    // Update the blog post
    const updatedPost = await prisma.blogPost.update({
      where: { id: blogPostId },
      data,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
        templates: true,
      },
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 'P2002') { // Unique constraint failed
      return res.status(409).json({ error: 'A blog post with this title already exists.' });
    }
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// DELETE /api/blog-posts/[id] - Protected route (only by the creator or admin)
handler.delete(requireAuth(async (req, res) => {
  const { id } = req.query;
  const blogPostId = parseInt(id, 10);

  if (isNaN(blogPostId)) {
    return res.status(400).json({ error: 'Invalid blog post ID' });
  }

  try {
    // Check if blog post exists and is not already hidden
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
    });

    if (!existingPost || existingPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if the authenticated user is the author or an admin
    if (existingPost.authorId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this blog post' });
    }

    // Soft delete by setting hidden to true
    await prisma.blogPost.update({
      where: { id: blogPostId },
      data: { hidden: true },
    });

    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

export default handler;
