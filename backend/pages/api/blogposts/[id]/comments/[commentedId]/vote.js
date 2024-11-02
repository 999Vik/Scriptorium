// // pages/api/blogposts/[id]/comments/[commentedId]/vote.js

// import prisma from '../../../../../../lib/prisma';
// import { requireAuth } from '../../../../../../lib/auth';
// import nextConnect from 'next-connect';

// const handler = nextConnect();

// // POST /api/blogposts/[id]/comments/[commentedId]/vote
// handler.post(requireAuth(async (req, res) => {
//   const { id, commentedId } = req.query;
//   const blogPostId = parseInt(id, 10);
//   const commentId = parseInt(commentedId, 10);
//   const userId = req.user.id;

//   // Validate blogPostId and commentId
//   if (isNaN(blogPostId) || isNaN(commentId)) {
//     return res.status(400).json({ error: 'Invalid blog post ID or comment ID.' });
//   }

//   const { voteType } = req.body; // Expecting 'upvote' or 'downvote'

//   // Validate voteType
//   if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
//     return res.status(400).json({ error: "Vote must be either 'upvote' or 'downvote'." });
//   }

//   try {
//     // Verify the comment exists and belongs to the specified blog post
//     const existingComment = await prisma.comment.findUnique({
//       where: { id: commentId },
//     });

//     if (!existingComment || existingComment.blogPostId !== blogPostId) {
//       return res.status(404).json({ error: 'Comment not found.' });
//     }

//     // Check if the user has already voted on this comment
//     const existingVote = await prisma.vote.findUnique({
//       where: {
//         userId_commentId: {
//           userId: userId,
//           commentId: commentId,
//         },
//       },
//     });

//     if (existingVote) {
//       return res.status(400).json({ error: 'You have already voted on this comment.' });
//     }

//     // Create a new vote
//     const newVote = await prisma.vote.create({
//       data: {
//         type: voteType, // 'upvote' or 'downvote'
//         user: { connect: { id: userId } },
//         comment: { connect: { id: commentId } },
//       },
//     });

//     // Update the vote count in the comment
//     let updatedComment;
//     if (voteType === 'upvote') {
//       updatedComment = await prisma.comment.update({
//         where: { id: commentId },
//         data: { upvotes: existingComment.upvotes + 1 },
//         select: {
//           id: true,
//           upvotes: true,
//           downvotes: true,
//         },
//       });
//     } else if (voteType === 'downvote') {
//       updatedComment = await prisma.comment.update({
//         where: { id: commentId },
//         data: { downvotes: existingComment.downvotes + 1 },
//         select: {
//           id: true,
//           upvotes: true,
//           downvotes: true,
//         },
//       });
//     }

//     res.status(200).json({
//       message: `Comment ${voteType}d successfully.`,
//       comment: updatedComment,
//     });
//   } catch (error) {
//     console.error('Error voting on comment:', error);
//     res.status(500).json({ error: 'Internal server error.' });
//   }
// }));

// export default handler;
// pages/api/blogposts/[id]/comments/[commentedId]/vote.js

import prisma from '../../../../../../lib/prisma';
import { requireAuth } from '../../../../../../lib/auth';
import nextConnect from 'next-connect';

const handler = nextConnect();

// POST /api/blogposts/[id]/comments/[commentedId]/vote
handler.post(requireAuth(async (req, res) => {
  const { id, commentedId } = req.query;
  const blogPostId = parseInt(id, 10);
  const commentId = parseInt(commentedId, 10);
  const userId = req.user.id;

  // Validate blogPostId and commentId
  if (isNaN(blogPostId) || isNaN(commentId)) {
    return res.status(400).json({ error: 'Invalid blog post ID or comment ID.' });
  }

  const { voteType } = req.body; // Expecting 'upvote' or 'downvote'

  // Validate voteType
  if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
    return res.status(400).json({ error: "Vote must be either 'upvote' or 'downvote'." });
  }

  try {
    // Verify the comment exists and belongs to the specified blog post
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment || existingComment.blogPostId !== blogPostId) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    // Check if the user has already voted on this comment
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_commentId: {
          userId: userId,
          commentId: commentId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        // User is toggling their vote off
        // Delete the existing vote
        await prisma.vote.delete({
          where: {
            id: existingVote.id,
          },
        });

        // Decrement the corresponding vote count in the comment
        if (voteType === 'upvote') {
          await prisma.comment.update({
            where: { id: commentId },
            data: { upvotes: { decrement: 1 } },
          });
        } else if (voteType === 'downvote') {
          await prisma.comment.update({
            where: { id: commentId },
            data: { downvotes: { decrement: 1 } },
          });
        }

        return res.status(200).json({
          message: `Your ${voteType} has been removed.`,
          comment: {
            id: commentId,
            upvotes: existingComment.upvotes - (voteType === 'upvote' ? 1 : 0),
            downvotes: existingComment.downvotes - (voteType === 'downvote' ? 1 : 0),
          },
        });
      } else {
        // User is changing their vote
        // Update the vote type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType },
        });

        // Adjust the vote counts
        if (voteType === 'upvote') {
          await prisma.comment.update({
            where: { id: commentId },
            data: { upvotes: { increment: 1 }, downvotes: { decrement: 1 } },
          });
        } else if (voteType === 'downvote') {
          await prisma.comment.update({
            where: { id: commentId },
            data: { downvotes: { increment: 1 }, upvotes: { decrement: 1 } },
          });
        }

        return res.status(200).json({
          message: `Your vote has been changed to ${voteType}.`,
          comment: {
            id: commentId,
            upvotes: voteType === 'upvote' ? existingComment.upvotes + 1 : existingComment.upvotes - 1,
            downvotes: voteType === 'downvote' ? existingComment.downvotes + 1 : existingComment.downvotes - 1,
          },
        });
      }
    } else {
      // User has not voted on this comment yet
      // Create a new vote
      const newVote = await prisma.vote.create({
        data: {
          type: voteType, // 'upvote' or 'downvote'
          user: { connect: { id: userId } },
          comment: { connect: { id: commentId } },
        },
      });

      // Increment the corresponding vote count in the comment
      let updatedComment;
      if (voteType === 'upvote') {
        updatedComment = await prisma.comment.update({
          where: { id: commentId },
          data: { upvotes: { increment: 1 } },
          select: {
            id: true,
            upvotes: true,
            downvotes: true,
          },
        });
      } else if (voteType === 'downvote') {
        updatedComment = await prisma.comment.update({
          where: { id: commentId },
          data: { downvotes: { increment: 1 } },
          select: {
            id: true,
            upvotes: true,
            downvotes: true,
          },
        });
      }

      return res.status(200).json({
        message: `Comment ${voteType}d successfully.`,
        comment: updatedComment,
      });
    }
  } catch (error) {
    console.error('Error voting on comment:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}));

export default handler;
