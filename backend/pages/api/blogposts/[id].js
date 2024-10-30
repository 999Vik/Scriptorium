// pages/api/blog-posts/[id].js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const blogPostId = parseInt(id);

  if (isNaN(blogPostId)) {
    return res.status(400).json({ error: 'Invalid blog post ID' });
  }

  switch (method) {
    case 'GET':
      // Retrieve a single blog post
      try {
        const blogPost = await prisma.blogPost.findUnique({
          where: { id: blogPostId },
          include: {
            author: { select: { id, email, name } },
            tags: { select: { name: true } },
            comments: {
              where: { hidden: false }, // Exclude hidden comments
              include: {
                author: { select: { id, email, name } },
              },
            },
          },
        });

        if (!blogPost || blogPost.hidden) {
          return res.status(404).json({ error: 'Blog post not found' });
        }

        return res.status(200).json(blogPost);
      } catch (error) {
        console.error('Error retrieving blog post:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'PUT':
      // Update a blog post
      const { title, description, content, tags } = req.body;

      // Validate at least one field to update
      if (!title && !description && !content && !tags) {
        return res.status(400).json({ error: 'At least one field to update is required' });
      }

      try {
        // Fetch the existing blog post
        const existingPost = await prisma.blogPost.findUnique({
          where: { id: blogPostId },
        });

        if (!existingPost || existingPost.hidden) {
          return res.status(404).json({ error: 'Blog post not found' });
        }

        // Handle tags if provided
        let tagOperations;
        if (tags) {
          tagOperations = tags.map((tagName) => ({
            where: { name: tagName },
            create: { name: tagName },
          }));
        }

        // Update the blog post
        const updatedBlogPost = await prisma.blogPost.update({
          where: { id: blogPostId },
          data: {
            title: title || existingPost.title,
            description: description || existingPost.description,
            content: content || existingPost.content,
            tags: tags
              ? {
                  set: [], // Remove existing tags
                  connectOrCreate: tagOperations, // Add new tags
                }
              : undefined,
          },
          include: {
            tags: true,
            author: { select: { id, email, name } },
          },
        });

        return res.status(200).json(updatedBlogPost);
      } catch (error) {
        console.error('Error updating blog post:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    case 'DELETE':
      // Delete a blog post
      try {
        // Check if the blog post exists
        const existingPost = await prisma.blogPost.findUnique({
          where: { id: blogPostId },
        });

        if (!existingPost || existingPost.hidden) {
          return res.status(404).json({ error: 'Blog post not found' });
        }

        // Delete the blog post
        await prisma.blogPost.delete({
          where: { id: blogPostId },
        });

        return res.status(200).json({ message: 'Blog post deleted successfully' });
      } catch (error) {
        console.error('Error deleting blog post:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
