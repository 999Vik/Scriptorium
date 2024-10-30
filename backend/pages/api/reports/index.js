// pages/api/reports/index.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Create a new report
    const { reason, description, blogPostId, commentId } = req.body;

    // Validate required fields
    if (!reason || (!blogPostId && !commentId)) {
      return res.status(400).json({ error: 'Reason and either blogPostId or commentId are required' });
    }

    // Ensure only one of blogPostId or commentId is provided
    if ((blogPostId && commentId) || (!blogPostId && !commentId)) {
      return res.status(400).json({ error: 'Provide either blogPostId or commentId, but not both' });
    }

    try {
      // Assigning to the default user with id: 1
      const reporter = await prisma.user.findUnique({ where: { id: 1 } });
      if (!reporter) {
        return res.status(400).json({ error: 'Reporter user not found' });
      }

      // Verify existence of the reported content
      if (blogPostId) {
        const blogPost = await prisma.blogPost.findUnique({ where: { id: blogPostId } });
        if (!blogPost || blogPost.hidden) {
          return res.status(404).json({ error: 'Blog post not found or already hidden' });
        }
      }

      if (commentId) {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment || comment.hidden) {
          return res.status(404).json({ error: 'Comment not found or already hidden' });
        }
      }

      // Create the report
      const newReport = await prisma.report.create({
        data: {
          reason,
          description: description || null,
          reporter: { connect: { id: 1 } }, // Default reporter
          blogPost: blogPostId ? { connect: { id: blogPostId } } : undefined,
          comment: commentId ? { connect: { id: commentId } } : undefined,
        },
        include: {
          reporter: { select: { id, email, name } },
          blogPost: { select: { id, title } },
          comment: { select: { id, content } },
        },
      });

      return res.status(201).json(newReport);
    } catch (error) {
      console.error('Error creating report:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Retrieve all reports
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
      const [total, reports] = await Promise.all([
        prisma.report.count(),
        prisma.report.findMany({
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            reporter: { select: { id, email, name } },
            blogPost: { select: { id, title } },
            comment: { select: { id, content } },
          },
        }),
      ]);

      return res.status(200).json({
        data: reports,
        meta: {
          total,
          page: parseInt(page),
          lastPage: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error retrieving reports:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
