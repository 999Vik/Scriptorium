// pages/api/users/[id].js

import prisma from "../../../lib/prisma";
import { requireAuth } from "../../../lib/auth";
import nextConnect from "next-connect";
import bcrypt from "bcrypt";

const handler = nextConnect();

handler.put(
  requireAuth(async (req, res) => {
    const { id } = req.query;
    const {
      firstName,
      lastName,
      email,
      password,
      profilePicture,
      phoneNumber,
    } = req.body;
    const { user } = req;

    const userId = parseInt(id);

    if (user.id !== userId && !user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden: Cannot update other users" });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const updateData = {
        firstName: firstName ?? existingUser.firstName,
        lastName: lastName ?? existingUser.lastName,
        email: email ?? existingUser.email,
        profilePicture: profilePicture ?? existingUser.profilePicture,
        phoneNumber: phoneNumber ?? existingUser.phoneNumber,
      };

      if (password) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        updateData.password = hashedPassword;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePicture: true,
          phoneNumber: true,
          isAdmin: true,
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);

      if (error.code === "P2002" && error.meta.target.includes("email")) {
        return res.status(409).json({ error: "Email already in use" });
      }

      res.status(500).json({ error: "Error updating user" });
    }
  })
);

handler.delete(
  requireAuth(async (req, res) => {
    const { id } = req.query;
    const { user } = req;

    const userId = parseInt(id);

    if (user.id !== userId && !user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden: Cannot delete other users" });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      await prisma.user.delete({
        where: { id: userId },
      });

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Error deleting user" });
    }
  })
);

export default handler;
