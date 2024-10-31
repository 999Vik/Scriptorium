import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import nextConnect from "next-connect";
import multer from "../../../lib/multer";
import jwt from "jsonwebtoken";

const handler = nextConnect({
  onError(error, req, res) {
    res.status(500).json({ error: error.message });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  },
});

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    console.log(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
      },
    });

    res.status(201).json({ message: "User created successfully" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
