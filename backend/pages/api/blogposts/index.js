// // pages/api/blog-posts/index.js

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     // Handle GET request: Retrieve all blog posts
//     try {
//       const blogPosts = await prisma.blogPost.findMany({
//         include: {
//           author: {
//             select: { id: true, firstName: true, lastName: true, email: true },
//           },
//           tags: true,
//         },
//         orderBy: { createdAt: 'desc' },
//       });
//       res.status(200).json(blogPosts);
//     } catch (error) {
//       console.error('Error fetching blog posts:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   } else if (req.method === 'POST') {
//     // Handle POST request: Create a new blog post
//     const { title, description, content, tags, authorId } = req.body;

//     // Validate required fields
//     if (!title || !description || !content || !authorId) {
//       return res.status(400).json({ error: 'Title, description, content, and authorId are required' });
//     }

//     try {
//       // Create or connect tags
//       const tagConnectOrCreate = tags?.map((tag) => ({
//         where: { name: tag },
//         create: { name: tag },
//       })) || [];

//       // Create the blog post
//       const newBlogPost = await prisma.blogPost.create({
//         data: {
//           title,
//           description,
//           content,
//           author: { connect: { id: authorId } },
//           tags: {
//             connectOrCreate: tagConnectOrCreate,
//           },
//         },
//         include: {
//           author: {
//             select: { id: true, firstName: true, lastName: true, email: true },
//           },
//           tags: true,
//         },
//       });

//       res.status(201).json(newBlogPost);
//     } catch (error) {
//       console.error('Error creating blog post:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   } else {
//     // Method Not Allowed
//     res.setHeader('Allow', ['GET', 'POST']);
//     res.status(405).json({ error: `Method ${req.method} Not Allowed` });
//   }
// }

// pages/api/blog-posts/index.js

import prisma from '../../../lib/prisma';
import * as Yup from 'yup';

// Define schema for input validation
const createBlogPostSchema = Yup.object().shape({
  title: Yup.string().trim().required('Title is required').max(200),
  description: Yup.string().trim().required('Description is required').max(1000),
  content: Yup.string().trim().required('Content is required'),
  tags: Yup.array().of(Yup.string().trim().max(50)),
  authorId: Yup.number().required('Author ID is required'),
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Handle GET request: Retrieve all blog posts with filters, pagination, and sorting
    return handleGET(req, res);
  } else if (req.method === 'POST') {
    // Handle POST request: Create a new blog post
    return handlePOST(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// GET /api/blog-posts?page=1&limit=10&sortBy=rating&search=title&tags=tag1,tag2
async function handleGET(req, res) {
  const { page = 1, limit = 10, sortBy = 'createdAt', search, tags } = req.query;

  try {
    // Parse pagination inputs
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    // Basic filters object
    const filters = { hidden: false };

    // Add search filter if search parameter is provided
    if (search) {
      filters.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add tags filter if tags parameter is provided
    if (tags) {
      filters.tags = {
        some: { name: { in: tags.split(',').map(tag => tag.trim()) } },
      };
    }

    // Pagination and ordering
    const skip = (parsedPage - 1) * parsedLimit;
    const take = parsedLimit;
    const orderBy = sortBy === 'rating' 
      ? [{ upvotes: 'desc' }, { downvotes: 'asc' }] 
      : { createdAt: 'desc' };

    // Fetch blog posts with filters, pagination, and ordering
    const blogPosts = await prisma.blogPost.findMany({
      where: filters,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
      },
      skip,
      take,
      orderBy,
    });

    // Total count for pagination metadata
    const total = await prisma.blogPost.count({ where: filters });
    const totalPages = Math.ceil(total / take);

    // Return response with data and pagination metadata
    res.status(200).json({ data: blogPosts, meta: { total, totalPages, page: parsedPage } });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


// POST /api/blog-posts
async function handlePOST(req, res) {
  try {
    // Validate request body
    const validatedData = await createBlogPostSchema.validate(req.body, { stripUnknown: true });
    const { title, description, content, tags, authorId } = validatedData;

    // Connect or create tags
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
        tags: { connectOrCreate: tagConnectOrCreate },
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
      },
    });

    res.status(201).json(newBlogPost);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
