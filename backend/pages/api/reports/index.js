// pages/api/reports/index.js


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

// GET /api/reports?page=1&limit=10
async function handleGET(req, res) {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const reports = await prisma.report.findMany({
      skip,
      take,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        blogPost: true,
        comment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.report.count();
    const totalPages = Math.ceil(total / take);

    return res.status(200).json({
      data: reports,
      meta: { total, totalPages, page: parseInt(page) },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/reports
async function handlePOST(req, res) {
  const { reason, description, blogPostId, commentId, reporterId } = req.body;

  if (!reason || (!blogPostId && !commentId) || !reporterId) {
    return res.status(400).json({
      error: 'Reason, reporterId, and either blogPostId or commentId are required',
    });
  }

  try {
    const data = {
      reason,
      description,
      reporter: { connect: { id: reporterId } },
    };

    if (blogPostId) {
      data.blogPost = { connect: { id: parseInt(blogPostId) } };
    }

    if (commentId) {
      data.comment = { connect: { id: parseInt(commentId) } };
    }

    const report = await prisma.report.create({
      data,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        blogPost: true,
        comment: true,
      },
    });

    return res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
