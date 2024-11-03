// pages/api/users/profile.js

import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../utils/auth";

async function handler(req, res) {
  const userId = req.user.id;

  if (req.method === "PUT") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        profilePicture: true,
        phoneNumber: true,
      },
    });

    res.status(200).json(user);
  } else if (req.method === "PUT") {
    const { firstName, lastName, profilePicture, phoneNumber } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        profilePicture,
        phoneNumber,
      },
    });

    res.status(200).json({ message: "Profile updated successfully" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default requireAuth(handler);
