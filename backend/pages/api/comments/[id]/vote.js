// // pages/api/comments/[id]/vote.js

// import prisma from '../../../../lib/prisma';

// export default async function handler(req, res) {
//   const { id } = req.query;
//   const commentId = parseInt(id, 10);
//   const { userId, voteType } = req.body; // `userId` of the user and `voteType` ("upvote" or "downvote")

//   if (!userId || !voteType) {
//     return res.status(400).json({ error: 'User ID and vote type are required' });
//   }

//   try {
//     // Check if a vote already exists from this user on this comment
//     const existingVote = await prisma.vote.findUnique({
//       where: {
//         userId_commentId: { userId, commentId }
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
//           commentId
//         }
//       });
//     }

//     // Update the upvotes/downvotes count on the comment
//     const upvotes = await prisma.vote.count({
//       where: { commentId, type: 'upvote' },
//     });
//     const downvotes = await prisma.vote.count({
//       where: { commentId, type: 'downvote' },
//     });

//     const updatedComment = await prisma.comment.update({
//       where: { id: commentId },
//       data: { upvotes, downvotes },
//       select: { id: true, upvotes: true, downvotes: true },
//     });

//     res.status(200).json(updatedComment);
//   } catch (error) {
//     console.error('Error handling vote:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// }
// pages/api/comments/[id]/vote.js

import prisma from '../../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'POST') {
    const { userId, type } = req.body;

    // Validate required fields
    if (!userId || !type || (type !== 'upvote' && type !== 'downvote')) {
      return res.status(400).json({ error: 'userId and valid type ("upvote" or "downvote") are required.' });
    }

    try {
      // Check if the comment exists
      const comment = await prisma.comment.findUnique({ where: { id: parseInt(id, 10) } });
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found.' });
      }

      // Check if the user has already voted on this comment
      const existingVote = await prisma.vote.findUnique({
        where: { userId_commentId: { userId, commentId: parseInt(id, 10) } },
      });

      if (existingVote) {
        // If the vote type is the same, remove the vote (toggle off)
        if (existingVote.type === type) {
          await prisma.vote.delete({ where: { id: existingVote.id } });
        } else {
          // If the vote type is different, update it
          await prisma.vote.update({
            where: { id: existingVote.id },
            data: { type },
          });
        }
      } else {
        // Create a new vote if it doesn't exist
        await prisma.vote.create({
          data: {
            type,
            user: { connect: { id: userId } },
            comment: { connect: { id: parseInt(id, 10) } },
          },
        });
      }

      // Update the upvote and downvote counts on the comment
      const upvotes = await prisma.vote.count({ where: { commentId: parseInt(id, 10), type: 'upvote' } });
      const downvotes = await prisma.vote.count({ where: { commentId: parseInt(id, 10), type: 'downvote' } });

      const updatedComment = await prisma.comment.update({
        where: { id: parseInt(id, 10) },
        data: { upvotes, downvotes },
      });

      return res.status(200).json(updatedComment);
    } catch (error) {
      console.error('Error processing vote:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Retrieve vote counts for the specified comment
      const comment = await prisma.comment.findUnique({
        where: { id: parseInt(id, 10) },
        select: { upvotes: true, downvotes: true },
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found.' });
      }

      return res.status(200).json(comment);
    } catch (error) {
      console.error('Error fetching votes:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // If the method is not supported, return a 405 error
  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
