// pages/api/blogposts/index.js


import prisma from '../../../lib/prisma';

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

// GET /api/blogposts?page=1&limit=10
async function handleGET(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const blogPosts = await prisma.blogPost.findMany({
      skip,
      take,
      where: { hidden: false },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.blogPost.count({ where: { hidden: false } });
    const totalPages = Math.ceil(total / take);

    return res.status(200).json({
      data: blogPosts,
      meta: { total, totalPages, page: parseInt(page) },
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/blogposts
async function handlePOST(req, res) {
  const { title, description, content, tags } = req.body;

  if (!title || !description || !content) {
    return res.status(400).json({ error: 'Title, description, and content are required' });
  }

  try {
    // Connect to default user
    const defaultUser = await prisma.user.findUnique({
      where: { email: 'default@scriptorium.com' },
    });

    if (!defaultUser) {
      return res.status(500).json({ error: 'Default user not found' });
    }

    // Handle tags: create if not exists, connect existing
    const tagConnectOrCreate = tags?.map((tag) => ({
      where: { name: tag },
      create: { name: tag },
    })) || [];

    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        description,
        content,
        author: { connect: { id: defaultUser.id } },
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        tags: true,
      },
    });

    return res.status(201).json(blogPost);
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
