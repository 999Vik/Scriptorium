// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if default user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'default@scriptorium.com' },
  });

  if (!existingUser) {
    // Create default user
    await prisma.user.create({
      data: {
        email: 'default@scriptorium.com',
        name: 'Default User',
        profile: {
          create: {
            bio: 'This is the default user profile.',
          },
        },
      },
    });
    console.log('Default user created.');
  } else {
    console.log('Default user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
