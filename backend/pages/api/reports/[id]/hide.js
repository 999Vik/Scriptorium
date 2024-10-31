// pages/api/reports/[id]/hide.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  const reportId = parseInt(id);

  if (isNaN(reportId)) {
    return res.status(400).json({ error: 'Invalid report ID' });
  }

  if (method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    // Fetch the report
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { blogPost: true, comment: true },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Hide the reported content based on whether it's a blog post or a comment
    if (report.blogPostId) {
      await prisma.blogPost.update({
        where: { id: report.blogPostId },
        data: { hidden: true },
      });
    }

    if (report.commentId) {
      await prisma.comment.update({
        where: { id: report.commentId },
        data: { hidden: true },
      });
    }

    // Optionally, delete the report after handling
    await prisma.report.delete({
      where: { id: reportId },
    });

    return res.status(200).json({ message: 'Content hidden successfully' });
  } catch (error) {
    console.error('Error hiding content:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}