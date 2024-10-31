// pages/api/blog-posts/index.js

import { PrismaClient } from '@prisma/client';

// Instantiate Prisma Client directly
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGET(req, res);
  } else if (req.method === 'POST') {
    return handlePOST(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// GET /api/blog-posts
async function handleGET(req, res) {
  console.log(`Received GET request at /api/blog-posts`);

  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: { hidden: false },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Fetched ${blogPosts.length} blog posts`);

    // Log the fetched blog posts for debugging
    console.log('Blog Posts Data:', JSON.stringify(blogPosts, null, 2));

    // Ensure blogPosts is an array
    if (!Array.isArray(blogPosts)) {
      console.error('blogPosts is not an array:', blogPosts);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ data: blogPosts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', error);
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}


// POST /api/blog-posts
async function handlePOST(req, res) {
  const { title, description, content, tags, authorId } = req.body;

  console.log('Received POST data:', { title, description, content, tags, authorId });

  // Validate required fields
  if (!title || !description || !content || !authorId) {
    console.error('Missing required fields in POST data:', { title, description, content, authorId });
    return res.status(400).json({
      error: 'Title, description, content, and authorId are required',
    });
  }

  try {
    // Check if the author exists
    const author = await prisma.user.findUnique({
      where: { id: parseInt(authorId, 10) },
    });

    if (!author) {
      console.warn(`Author with id=${authorId} not found`);
      return res.status(404).json({ error: 'Author not found' });
    }

    // Handle tags: create if not exists, connect existing
    const tagConnectOrCreate = tags?.map((tag) => ({
      where: { name: tag },
      create: { name: tag },
    })) || [];

    console.log('Connecting or creating tags:', tagConnectOrCreate);

    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        description,
        content,
        author: { connect: { id: parseInt(authorId, 10) } },
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
      },
    });

    console.log('Created blog post:', blogPost);

    return res.status(201).json(blogPost);
  } catch (error) {
    console.error('Error creating blog post:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', error);
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

