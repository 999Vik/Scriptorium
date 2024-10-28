import bcrypt from 'bcrypt';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { firstName, lastName, email, password } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    try {
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: 'USER',
        },
      });

      // Exclude password from response
      const { password, ...userData } = user;
      res.status(201).json(userData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
