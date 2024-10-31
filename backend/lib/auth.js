// lib/auth.js

import jwt from 'jsonwebtoken';
import prisma from './prisma';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

export async function getSession(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  const token = authHeader.split(' ')[1];

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) return null;

    return { user };
  } catch (error) {
    console.error(error);
    return null;
  }
}
