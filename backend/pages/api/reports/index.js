// pages/api/reports/index.js

import { authenticate, authorize } from '../../../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    await authenticate(req, res, async () => {
      const { reason, description, blogPostId, commentId } = req.body;

      if (!reason || (!blogPostId && !commentId)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Ensure only one of blogPostId or commentId is provided
        if ((blogPostId && commentId) || (!blogPostId && !commentId)) {
          return res.status(400).json({ error: 'Provide either blogPostId or commentId, not both' });
        }

        // Verify existence of the reported content
        if (blogPostId) {
          const blogPost = await prisma.blogPost.findUnique({ where: { id: blogPostId } });
          if (!blogPost) {
            return res.status(404).json({ error: 'Blog post not found' });
          }
        }

        if (commentId) {
          const comment = await prisma.comment.findUnique({ where: { id: commentId } });
          if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
          }
        }

        const report = await prisma.report.create({
          data: {
            reason,
            description: description || null,
            reporterId: req.user.id,
            blogPostId: blogPostId || null,
            commentId: commentId || null,
          },
        });

        return res.status(201).json(report);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  } else if (req.method === 'GET') {
    await authenticate(req, res, authorize('ADMIN'), async () => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      try {
        const [total, reports] = await Promise.all([
          prisma.report.count(),
          prisma.report.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              reporter: { select: { id, firstName, lastName } },
              blogPost: { select: { id, title } },
              comment: { select: { id, content } },
            },
          }),
        ]);

        return res.status(200).json({
          data: reports,
          meta: {
            total,
            page,
            lastPage: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
