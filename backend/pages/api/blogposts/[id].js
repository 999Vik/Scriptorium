import prisma from '../../../lib/prisma';
import * as Yup from 'yup';

const updateBlogPostSchema = Yup.object().shape({
  title: Yup.string().trim().max(200),
  description: Yup.string().trim().max(1000),
  content: Yup.string().trim(),
  tags: Yup.array().of(Yup.string().trim().max(50)),
  templateIds: Yup.array().of(Yup.number().integer()),
});

export default async function handler(req, res) {
  const { id } = req.query;
  const blogPostId = parseInt(id, 10);

  if (isNaN(blogPostId)) {
    return res.status(400).json({ error: 'Invalid blog post ID' });
  }

  if (req.method === 'GET') {
    return handleGET(req, res, blogPostId);
  } else if (req.method === 'PUT') {
    return handlePUT(req, res, blogPostId);
  } else if (req.method === 'DELETE') {
    return handleDELETE(req, res, blogPostId);
  } else {
    // Method Not Allowed
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// GET /api/blog-posts/[id]
async function handleGET(req, res, blogPostId) {
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
}

// PUT /api/blog-posts/[id]
async function handlePUT(req, res, blogPostId) {
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
}

// DELETE /api/blog-posts/[id]
async function handleDELETE(req, res, blogPostId) {
  try {
    // Check if blog post exists and is not already hidden
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
    });

    if (!existingPost || existingPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found' });
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
}
