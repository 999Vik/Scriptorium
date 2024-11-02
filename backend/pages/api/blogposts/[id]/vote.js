// // pages/api/blog-posts/[id]/vote.js

// import prisma from '../../../../lib/prisma';

// export default async function handler(req, res) {
//   const { id } = req.query;
//   const blogPostId = parseInt(id, 10);
//   const { userId, voteType } = req.body; // `userId` of the user and `voteType` ("upvote" or "downvote")

//   if (!userId || !voteType) {
//     return res.status(400).json({ error: 'User ID and vote type are required' });
//   }

//   try {
//     // Check if a vote already exists from this user on this blog post
//     const existingVote = await prisma.vote.findUnique({
//       where: {
//         userId_blogPostId: { userId, blogPostId }
//       },
//     });

//     if (existingVote) {
//       // If the vote type is the same, remove it to "toggle off"
//       if (existingVote.type === voteType) {
//         await prisma.vote.delete({
//           where: { id: existingVote.id }
//         });
//       } else {
//         // If the vote type is different, update it
//         await prisma.vote.update({
//           where: { id: existingVote.id },
//           data: { type: voteType }
//         });
//       }
//     } else {
//       // If no existing vote, create a new one
//       await prisma.vote.create({
//         data: {
//           type: voteType,
//           userId,
//           blogPostId
//         }
//       });
//     }

//     // Update the upvotes/downvotes count on the blog post
//     const upvotes = await prisma.vote.count({
//       where: { blogPostId, type: 'upvote' },
//     });
//     const downvotes = await prisma.vote.count({
//       where: { blogPostId, type: 'downvote' },
//     });

//     const updatedPost = await prisma.blogPost.update({
//       where: { id: blogPostId },
//       data: { upvotes, downvotes },
//       select: { id: true, upvotes: true, downvotes: true },
//     });

//     res.status(200).json(updatedPost);
//   } catch (error) {
//     console.error('Error handling vote:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }
// pages/api/blog-posts/[id]/vote.js

import prisma from '../../../../lib/prisma';
import { requireAuth } from "../../../../lib/auth";
import nextConnect from 'next-connect';

const handler = nextConnect();

// POST /api/blog-posts/[id]/vote - Protected route (authenticated users only)
handler.post(requireAuth(async (req, res) => {
  const { id } = req.query;
  const blogPostId = parseInt(id, 10);
  const { voteType } = req.body; // Only `voteType` ("upvote" or "downvote")

  // Validate `voteType`
  if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
    return res.status(400).json({ error: 'Valid vote type ("upvote" or "downvote") is required' });
  }

  try {
    const userId = req.user.id; // Fetching user ID from authenticated user

    // Check if the blog post exists
    const blogPost = await prisma.blogPost.findUnique({
      where: { id: blogPostId },
    });

    if (!blogPost || blogPost.hidden) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Check if a vote already exists from this user on this blog post
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_blogPostId: { userId, blogPostId }
      },
    });

    if (existingVote) {
      // If the vote type is the same, remove it to "toggle off"
      if (existingVote.type === voteType) {
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // If the vote type is different, update it
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType }
        });
      }
    } else {
      // If no existing vote, create a new one
      await prisma.vote.create({
        data: {
          type: voteType,
          userId,
          blogPostId
        }
      });
    }

    // Update the upvotes/downvotes count on the blog post
    const upvotes = await prisma.vote.count({
      where: { blogPostId, type: 'upvote' },
    });
    const downvotes = await prisma.vote.count({
      where: { blogPostId, type: 'downvote' },
    });

    const updatedPost = await prisma.blogPost.update({
      where: { id: blogPostId },
      data: { upvotes, downvotes },
      select: { id: true, upvotes: true, downvotes: true },
    });

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error handling vote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

export default handler;
