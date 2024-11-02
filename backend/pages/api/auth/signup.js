// pages/api/auth/signup.js

import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "../../../lib/multer";
import nextConnect from "next-connect";
import fs from "fs";
import path from "path";

const handler = nextConnect({
  onError(error, req, res) {
    console.error("An error occurred:", error.message);
    res.status(500).json({ error: error.message });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

handler.use(multer.single("avatar"));

handler.post(async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle avatar upload
    let profilePicturePath = null;
    if (req.file) {
      profilePicturePath = `/avatars/${req.file.filename}`;
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
        profilePicture: profilePicturePath,
      },
    });

    // Optionally, rename the avatar file to include user ID for consistency
    if (req.file) {
      const oldPath = req.file.path;
      const newFilename = `user-${user.id}-${Date.now()}${path.extname(
        req.file.originalname
      )}`;
      const newPath = path.join(
        process.cwd(),
        "public",
        "avatars",
        newFilename
      );

      fs.renameSync(oldPath, newPath); // Rename the file

      // Update user with new profile picture path
      await prisma.user.update({
        where: { id: user.id },
        data: { profilePicture: `/avatars/${newFilename}` },
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    const refresh_token = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ token, refresh_token });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default handler;