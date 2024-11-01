// pages/api/reports/index.js

import { PrismaClient } from '@prisma/client';

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

// GET /api/reports?page=1&limit=10
async function handleGET(req, res) {
  let { page = 1, limit = 10 } = req.query;

  // Parse and validate query parameters
  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return res.status(400).json({ error: 'Invalid page or limit parameter' });
  }

  const skip = (page - 1) * limit;
  const take = limit;

  try {
    const reports = await prisma.report.findMany({
      skip,
      take,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        blogPost: true,
        comment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.report.count();
    const totalPages = Math.ceil(total / take);

    return res.status(200).json({
      data: reports,
      meta: { total, totalPages, page },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    console.error('Error details:', JSON.stringify(error));
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/reports
// async function handlePOST(req, res) {
//   const { reason, description, blogPostId, commentId, reporterId } = req.body;

//   // Validate required fields
//   if (!reason || !reporterId || (!blogPostId && !commentId)) {
//     return res.status(400).json({
//       error: 'Reason, reporterId, and either blogPostId or commentId are required',
//     });
//   }

//   try {
//     // Check if reporter exists
//     const reporter = await prisma.user.findUnique({
//       where: { id: parseInt(reporterId) },
//     });

//     if (!reporter) {
//       return res.status(404).json({ error: 'Reporter not found' });
//     }

//     // If reporting a blog post, verify it exists and is not hidden
//     if (blogPostId) {
//       const blogPost = await prisma.blogPost.findUnique({
//         where: { id: parseInt(blogPostId) },
//       });

//       if (!blogPost || blogPost.hidden) {
//         return res.status(404).json({ error: 'Blog post not found' });
//       }
//     }

//     // If reporting a comment, verify it exists and is not hidden
//     if (commentId) {
//       const comment = await prisma.comment.findUnique({
//         where: { id: parseInt(commentId) },
//       });

//       if (!comment || comment.hidden) {
//         return res.status(404).json({ error: 'Comment not found' });
//       }
//     }

//     const data = {
//       reason,
//       description,
//       reporter: { connect: { id: parseInt(reporterId) } },
//     };

//     if (blogPostId) {
//       data.blogPost = { connect: { id: parseInt(blogPostId) } };
//     }

//     if (commentId) {
//       data.comment = { connect: { id: parseInt(commentId) } };
//     }

//     const report = await prisma.report.create({
//       data,
//       include: {
//         reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
//         blogPost: true,
//         comment: true,
//       },
//     });

//     return res.status(201).json(report);
//   } catch (error) {
//     console.error('Error creating report:', error);
//     console.error('Error details:', JSON.stringify(error));
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// }
// POST /api/reports
async function handlePOST(req, res) {
  const { reason, blogPostId, reporterId } = req.body;

  // Validate required fields
  if (!reason || !reporterId || !blogPostId) {
    return res.status(400).json({
      error: 'Reason, reporterId, and blogPostId are required',
    });
  }

  try {
    // Check if reporter exists
    const reporter = await prisma.user.findUnique({
      where: { id: parseInt(reporterId, 10) },
    });

    if (!reporter) {
      return res.status(404).json({ error: 'Reporter not found' });
    }

    // Check if the blog post exists and is not already hidden
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: parseInt(blogPostId, 10) },
    });

    if (!blogPost || blogPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found or already hidden' });
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reason,
        reporter: { connect: { id: parseInt(reporterId, 10) } },
        blogPost: { connect: { id: parseInt(blogPostId, 10) } },
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        blogPost: { select: { id: true, title: true, hidden: true } },
      },
    });

    // Mark the blog post as hidden
    await prisma.blogPost.update({
      where: { id: parseInt(blogPostId, 10) },
      data: { hidden: true },
    });

    return res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
