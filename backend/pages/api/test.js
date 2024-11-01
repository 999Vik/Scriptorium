// // prisma/test.js

// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export default async function main() {
//   try {
//     const blogPosts = await prisma.blogPost.findMany({
//       where: { hidden: false },
//       include: {
//         author: {
//           select: { id: true, firstName: true, lastName: true, email: true },
//         },
//         tags: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//     console.log('Fetched blog posts:', blogPosts);
//   } catch (error) {
//     console.error('Error fetching blog posts:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// main();

import nextConnect from "next-connect";

const handler = nextConnect()
handler.get((req, res) => {
  res.status(200).json({ message: "Hello" });
});

export default handler;