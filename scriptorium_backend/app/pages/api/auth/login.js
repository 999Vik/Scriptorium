import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Exclude password from response
    const { password: _, ...userData } = user;

    res.status(200).json({ token, user: userData });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
