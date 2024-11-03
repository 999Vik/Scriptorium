// // pages/api/reports/index.js

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     return handleGET(req, res);
//   } else if (req.method === 'POST') {
//     return handlePOST(req, res);
//   } else {
//     res.setHeader('Allow', ['GET', 'POST']);
//     return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
//   }
// }

// // GET /api/reports?page=1&limit=10
// async function handleGET(req, res) {
//   let { page = 1, limit = 10 } = req.query;

//   // Parse and validate query parameters
//   page = parseInt(page);
//   limit = parseInt(limit);

//   if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
//     return res.status(400).json({ error: 'Invalid page or limit parameter' });
//   }

//   const skip = (page - 1) * limit;
//   const take = limit;

//   try {
//     const reports = await prisma.report.findMany({
//       skip,
//       take,
//       include: {
//         reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
//         blogPost: true,
//         comment: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });

//     const total = await prisma.report.count();
//     const totalPages = Math.ceil(total / take);

//     return res.status(200).json({
//       data: reports,
//       meta: { total, totalPages, page },
//     });
//   } catch (error) {
//     console.error('Error fetching reports:', error);
//     console.error('Error details:', JSON.stringify(error));
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// }

// async function handlePOST(req, res) {
//   const { reason, blogPostId, reporterId } = req.body;

//   // Validate required fields
//   if (!reason || !reporterId || !blogPostId) {
//     return res.status(400).json({
//       error: 'Reason, reporterId, and blogPostId are required',
//     });
//   }

//   try {
//     // Check if reporter exists
//     const reporter = await prisma.user.findUnique({
//       where: { id: parseInt(reporterId, 10) },
//     });

//     if (!reporter) {
//       return res.status(404).json({ error: 'Reporter not found' });
//     }

//     // Check if the blog post exists and is not already hidden
//     const blogPost = await prisma.blogPost.findUnique({
//       where: { id: parseInt(blogPostId, 10) },
//     });

//     if (!blogPost || blogPost.hidden) {
//       return res.status(404).json({ error: 'Blog post not found or already hidden' });
//     }

//     // Create the report
//     const report = await prisma.report.create({
//       data: {
//         reason,
//         reporter: { connect: { id: parseInt(reporterId, 10) } },
//         blogPost: { connect: { id: parseInt(blogPostId, 10) } },
//       },
//       include: {
//         reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
//         blogPost: { select: { id: true, title: true, hidden: true } },
//       },
//     });

//     // Mark the blog post as hidden
//     await prisma.blogPost.update({
//       where: { id: parseInt(blogPostId, 10) },
//       data: { hidden: true },
//     });

//     return res.status(201).json(report);
//   } catch (error) {
//     console.error('Error creating report:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// }

// pages/api/reports/index.js

import prisma from "../../../lib/prisma";
import { requireAuth, requireAdmin } from "../../../lib/auth";
import nextConnect from "next-connect";

const handler = nextConnect();

// GET /api/reports?page=1&limit=10 - Accessible only by admin users
handler.get(
  requireAdmin(async (req, res) => {
    let { page = 1, limit = 10 } = req.query;

    // Parse and validate query parameters
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({ error: "Invalid page or limit parameter" });
    }

    const skip = (page - 1) * limit;
    const take = limit;

    try {
      // Fetch reports with pagination
      const reports = await prisma.report.findMany({
        skip,
        take,
        include: {
          reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
          blogPost: { select: { id: true, title: true, hidden: true } },
          comment: { select: { id: true, content: true, authorId: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Get total count for pagination metadata
      const total = await prisma.report.count();
      const totalPages = Math.ceil(total / take);

      return res.status(200).json({
        data: reports,
        meta: { total, totalPages, page },
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  })
);

// POST /api/reports - Accessible by authenticated users
handler.post(
  requireAuth(async (req, res) => {
    const { reason, blogPostId, commentId } = req.body;
    const reporterId = req.user.id; // Automatically get the reporterId from the authenticated user

    // Validate required fields
    if (!reason || (!blogPostId && !commentId)) {
      return res.status(400).json({
        error: "Reason and either blogPostId or commentId are required",
      });
    }

    try {
      // Handle report for blog post
      if (blogPostId) {
        const parsedBlogPostId = parseInt(blogPostId, 10);
        if (isNaN(parsedBlogPostId)) {
          return res.status(400).json({ error: "Invalid blogPostId" });
        }

        // Check if the blog post exists and is not hidden
        const blogPost = await prisma.blogPost.findUnique({
          where: { id: parsedBlogPostId },
        });

        if (!blogPost || blogPost.hidden) {
          return res.status(404).json({ error: "Blog post not found or already hidden" });
        }

        // Prevent duplicate report
        const existingReport = await prisma.report.findFirst({
          where: { reporterId, blogPostId: parsedBlogPostId },
        });

        if (existingReport) {
          return res.status(400).json({ error: "You have already reported this blog post." });
        }

        // Create the report
        const report = await prisma.report.create({
          data: {
            reason,
            reporter: { connect: { id: reporterId } },
            blogPost: { connect: { id: parsedBlogPostId } },
          },
          include: {
            reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
            blogPost: { select: { id: true, title: true, hidden: true } },
          },
        });

        return res.status(201).json(report);
      }

      // Handle report for comment
      if (commentId) {
        const parsedCommentId = parseInt(commentId, 10);
        if (isNaN(parsedCommentId)) {
          return res.status(400).json({ error: "Invalid commentId" });
        }

        // Check if the comment exists
        const comment = await prisma.comment.findUnique({
          where: { id: parsedCommentId },
        });

        if (!comment) {
          return res.status(404).json({ error: "Comment not found" });
        }

        // Prevent duplicate report
        const existingReport = await prisma.report.findFirst({
          where: { reporterId, commentId: parsedCommentId },
        });

        if (existingReport) {
          return res.status(400).json({ error: "You have already reported this comment." });
        }

        // Create the report
        const report = await prisma.report.create({
          data: {
            reason,
            reporter: { connect: { id: reporterId } },
            comment: { connect: { id: parsedCommentId } },
          },
          include: {
            reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
            comment: { select: { id: true, content: true, authorId: true } },
          },
        });

        return res.status(201).json(report);
      }

      // If neither blogPostId nor commentId provided
      return res.status(400).json({ error: "Either blogPostId or commentId must be provided" });
    } catch (error) {
      console.error("Error creating report:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  })
);

export default handler;
