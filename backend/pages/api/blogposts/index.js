// // import prisma from '../../../lib/prisma';
// // import * as Yup from 'yup';

// // // Define schema for input validation
// // const createBlogPostSchema = Yup.object().shape({
// //   title: Yup.string().trim().required('Title is required').max(200),
// //   description: Yup.string().trim().required('Description is required').max(1000),
// //   content: Yup.string().trim().required('Content is required'),
// //   tags: Yup.array().of(Yup.string().trim().max(50)),
// //   authorId: Yup.number().required('Author ID is required'),
// // });

// // export default async function handler(req, res) {
// //   if (req.method === 'GET') {
// //     // Handle GET request: Retrieve all blog posts with filters, pagination, and sorting
// //     return handleGET(req, res);
// //   } else if (req.method === 'POST') {
// //     // Handle POST request: Create a new blog post
// //     return handlePOST(req, res);
// //   } else {
// //     res.setHeader('Allow', ['GET', 'POST']);
// //     res.status(405).json({ error: `Method ${req.method} Not Allowed` });
// //   }
// // }

// // // GET /api/blog-posts?page=1&limit=10&sortBy=rating&search=title&tags=tag1,tag2
// // async function handleGET(req, res) {
// //   const { page = 1, limit = 10, sortBy = 'createdAt', search, tags } = req.query;

// //   try {
// //     // Parse pagination inputs
// //     const parsedPage = parseInt(page, 10);
// //     const parsedLimit = parseInt(limit, 10);
// //     if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
// //       return res.status(400).json({ error: 'Invalid pagination parameters' });
// //     }

// //     // Initialize filters for Prisma without `title` contains filter
// //     const filters = { hidden: false };

// //     // Add tags filter if `tags` parameter is provided
// //     if (tags && tags.trim()) {
// //       filters.tags = {
// //         some: { name: { in: tags.split(',').map(tag => tag.trim()) } },
// //       };
// //     }

// //     // Set up pagination and ordering
// //     const skip = (parsedPage - 1) * parsedLimit;
// //     const take = parsedLimit;
// //     const orderBy = sortBy === 'rating' 
// //       ? [{ upvotes: 'desc' }, { downvotes: 'asc' }] 
// //       : { createdAt: 'desc' };

// //     // Fetch blog posts without `title` filter
// //     const allBlogPosts = await prisma.blogPost.findMany({
// //       where: filters,
// //       include: {
// //         author: { select: { id: true, firstName: true, lastName: true, email: true } },
// //         tags: true,
// //       },
// //       orderBy,
// //     });

// //     // Apply title search filter in JavaScript
// //     const filteredBlogPosts = search
// //       ? allBlogPosts.filter(post => 
// //           post.title.toLowerCase().includes(search.trim().toLowerCase())
// //         )
// //       : allBlogPosts;

// //     // Paginate results
// //     const paginatedBlogPosts = filteredBlogPosts.slice(skip, skip + take);
// //     const total = filteredBlogPosts.length;
// //     const totalPages = Math.ceil(total / take);

// //     // Send response with paginated and filtered data
// //     res.status(200).json({ data: paginatedBlogPosts, meta: { total, totalPages, page: parsedPage } });
// //   } catch (error) {
// //     console.error("Error fetching blog posts:", error);
// //     res.status(500).json({ error: 'Internal server error' });
// //   }
// // }



// // // POST /api/blog-posts
// // async function handlePOST(req, res) {
// //   try {
// //     // Validate request body
// //     const validatedData = await createBlogPostSchema.validate(req.body, { stripUnknown: true });
// //     const { title, description, content, tags, authorId } = validatedData;

// //     // Connect or create tags
// //     const tagConnectOrCreate = tags?.map((tag) => ({
// //       where: { name: tag },
// //       create: { name: tag },
// //     })) || [];

// //     // Create the blog post
// //     const newBlogPost = await prisma.blogPost.create({
// //       data: {
// //         title,
// //         description,
// //         content,
// //         author: { connect: { id: authorId } },
// //         tags: { connectOrCreate: tagConnectOrCreate },
// //       },
// //       include: {
// //         author: { select: { id: true, firstName: true, lastName: true, email: true } },
// //         tags: true,
// //       },
// //     });

// //     res.status(201).json(newBlogPost);
// //   } catch (error) {
// //     if (error.name === 'ValidationError') {
// //       return res.status(400).json({ error: error.message });
// //     }
// //     console.error('Error creating blog post:', error);
// //     res.status(500).json({ error: 'Internal server error' });
// //   }
// // }
// import prisma from '../../../lib/prisma';
// import * as Yup from 'yup';

// // Define schema for input validation
// const createBlogPostSchema = Yup.object().shape({
//   title: Yup.string().trim().required('Title is required').max(200),
//   description: Yup.string().trim().required('Description is required').max(1000),
//   content: Yup.string().trim().required('Content is required'),
//   tags: Yup.array().of(Yup.string().trim().max(50)),
//   authorId: Yup.number().required('Author ID is required'),
// });

// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     return handleGET(req, res);
//   } else if (req.method === 'POST') {
//     return handlePOST(req, res);
//   } else if (req.method === 'DELETE') {
//     return handleDELETE(req, res);
//   } else {
//     res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
//     res.status(405).json({ error: `Method ${req.method} Not Allowed` });
//   }
// }

// // GET /api/blog-posts
// async function handleGET(req, res) {
//   const { page = 1, limit = 10, sortBy = 'createdAt', search, tags } = req.query;

//   try {
//     const parsedPage = parseInt(page, 10);
//     const parsedLimit = parseInt(limit, 10);
//     if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
//       return res.status(400).json({ error: 'Invalid pagination parameters' });
//     }

//     const filters = { hidden: false };
//     if (tags && tags.trim()) {
//       filters.tags = {
//         some: { name: { in: tags.split(',').map(tag => tag.trim()) } },
//       };
//     }

//     const skip = (parsedPage - 1) * parsedLimit;
//     const take = parsedLimit;
//     const orderBy = sortBy === 'rating' 
//       ? [{ upvotes: 'desc' }, { downvotes: 'asc' }] 
//       : { createdAt: 'desc' };

//     const allBlogPosts = await prisma.blogPost.findMany({
//       where: filters,
//       include: {
//         author: { select: { id: true, firstName: true, lastName: true, email: true } },
//         tags: true,
//       },
//       orderBy,
//     });

//     const filteredBlogPosts = search
//       ? allBlogPosts.filter(post => 
//           post.title.toLowerCase().includes(search.trim().toLowerCase())
//         )
//       : allBlogPosts;

//     const paginatedBlogPosts = filteredBlogPosts.slice(skip, skip + take);
//     const total = filteredBlogPosts.length;
//     const totalPages = Math.ceil(total / take);

//     res.status(200).json({ data: paginatedBlogPosts, meta: { total, totalPages, page: parsedPage } });
//   } catch (error) {
//     console.error("Error fetching blog posts:", error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }

// // POST /api/blog-posts
// async function handlePOST(req, res) {
//   try {
//     const validatedData = await createBlogPostSchema.validate(req.body, { stripUnknown: true });
//     const { title, description, content, tags, authorId } = validatedData;

//     const tagConnectOrCreate = tags?.map((tag) => ({
//       where: { name: tag },
//       create: { name: tag },
//     })) || [];

//     const newBlogPost = await prisma.blogPost.create({
//       data: {
//         title,
//         description,
//         content,
//         author: { connect: { id: authorId } },
//         tags: { connectOrCreate: tagConnectOrCreate },
//       },
//       include: {
//         author: { select: { id: true, firstName: true, lastName: true, email: true } },
//         tags: true,
//       },
//     });

//     res.status(201).json(newBlogPost);
//   } catch (error) {
//     if (error.name === 'ValidationError') {
//       return res.status(400).json({ error: error.message });
//     }
//     console.error('Error creating blog post:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }

// // DELETE /api/blog-posts/[id]
// async function handleDELETE(req, res) {
//   const { id } = req.query;
//   const blogPostId = parseInt(id, 10);

//   const { userId, isAdmin } = req.body; // Assuming userId and isAdmin are passed in the request body or session

//   if (isNaN(blogPostId)) {
//     return res.status(400).json({ error: 'Invalid blog post ID' });
//   }

//   try {
//     // Retrieve the blog post to check for ownership or admin rights
//     const blogPost = await prisma.blogPost.findUnique({
//       where: { id: blogPostId },
//       select: { authorId: true },
//     });

//     if (!blogPost) {
//       return res.status(404).json({ error: 'Blog post not found' });
//     }

//     // Check if the user is the author or an admin
//     if (blogPost.authorId !== userId && !isAdmin) {
//       return res.status(403).json({ error: 'You are not authorized to delete this blog post' });
//     }

//     // Delete the blog post
//     await prisma.blogPost.delete({
//       where: { id: blogPostId },
//     });

//     res.status(200).json({ message: 'Blog post deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting blog post:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }
import prisma from '../../../lib/prisma';
import * as Yup from 'yup';

// Define schema for input validation
const createBlogPostSchema = Yup.object().shape({
  title: Yup.string().trim().required('Title is required').max(200),
  description: Yup.string().trim().required('Description is required').max(1000),
  content: Yup.string().trim().required('Content is required'),
  tags: Yup.array().of(Yup.string().trim().max(50)),
  authorId: Yup.number().required('Author ID is required'),
  templateIds: Yup.array().of(Yup.number().integer()), // Optional field for template IDs
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGET(req, res);
  } else if (req.method === 'POST') {
    return handlePOST(req, res);
  } else if (req.method === 'DELETE') {
    return handleDELETE(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

// GET /api/blog-posts
async function handleGET(req, res) {
  const { page = 1, limit = 10, sortBy = 'createdAt', search, tags } = req.query;

  try {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedPage) || isNaN(parsedLimit) || parsedPage < 1 || parsedLimit < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const filters = { hidden: false };
    if (tags && tags.trim()) {
      filters.tags = {
        some: { name: { in: tags.split(',').map(tag => tag.trim()) } },
      };
    }

    const skip = (parsedPage - 1) * parsedLimit;
    const take = parsedLimit;
    const orderBy = sortBy === 'rating' 
      ? [{ upvotes: 'desc' }, { downvotes: 'asc' }] 
      : { createdAt: 'desc' };

    const allBlogPosts = await prisma.blogPost.findMany({
      where: filters,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
        templates: { select: { id: true, title: true, explanation: true, code: true } }, // Include templates
      },
      orderBy,
    });

    const filteredBlogPosts = search
      ? allBlogPosts.filter(post => 
          post.title.toLowerCase().includes(search.trim().toLowerCase())
        )
      : allBlogPosts;

    const paginatedBlogPosts = filteredBlogPosts.slice(skip, skip + take);
    const total = filteredBlogPosts.length;
    const totalPages = Math.ceil(total / take);

    res.status(200).json({ data: paginatedBlogPosts, meta: { total, totalPages, page: parsedPage } });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/blog-posts
async function handlePOST(req, res) {
  try {
    const validatedData = await createBlogPostSchema.validate(req.body, { stripUnknown: true });
    const { title, description, content, tags, authorId, templateIds } = validatedData;

    const tagConnectOrCreate = tags?.map((tag) => ({
      where: { name: tag },
      create: { name: tag },
    })) || [];

    const templateConnect = templateIds?.map((id) => ({ id })) || [];

    const newBlogPost = await prisma.blogPost.create({
      data: {
        title,
        description,
        content,
        author: { connect: { id: authorId } },
        tags: { connectOrCreate: tagConnectOrCreate },
        templates: { connect: templateConnect }, // Link to templates here
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: true,
        templates: true, // Include templates in response
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

// DELETE /api/blog-posts/[id]
async function handleDELETE(req, res) {
  const { id } = req.query;
  const blogPostId = parseInt(id, 10);

  const { userId, isAdmin } = req.body;

  if (isNaN(blogPostId)) {
    return res.status(400).json({ error: 'Invalid blog post ID' });
  }

  try {
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
      select: { authorId: true },
    });

    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    if (blogPost.authorId !== userId && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this blog post' });
    }

    await prisma.blogPost.delete({
      where: { id: blogPostId },
    });

    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
