import prisma from "../../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { email, password } = req.body;
    console.log("email", email);
    console.log("password, ", password);

    if (!email || !password) {
      return res.status(400).json({ error: "Please fill all fields" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({ token, refreshToken });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
