import jwt from "jsonwebtoken";

export async function authenticateToken(req, res) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return { error: "Unauthorized: No token provided" };
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return { error: "Unauthorized: User not found" };
    }

    return { user };
  } catch (err) {
    return { error: "Unauthorized: Invalid token" };
  }
}

export function requireAuth(handler) {
  return async (req, res) => {
    const { user, error } = await authenticateToken(req, res);

    if (error) {
      return res.status(401).json({ error });
    }

    req.user = user;
    return handler(req, res);
  };
}

export function requireAdmin(handler) {
  return async (req, res) => {
    const { user, error } = await authenticateToken(req, res);

    if (error) {
      return res.status(401).json({ error });
    }

    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required" });
    }

    req.user = user;
    return handler(req, res);
  };
}
