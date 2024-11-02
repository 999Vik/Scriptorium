import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Please provide a refresh token" });
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const token = jwt.sign(
        { userId: decoded.userId },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.status(200).json({ token });
    } catch (err) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
