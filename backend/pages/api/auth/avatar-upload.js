import multer from "../../../lib/multer";
import nextConnect from "next-connect";
import { requireAuth } from "../../../lib/auth";
import prisma from "../../../lib/prisma";
import fs from "fs";
import path from "path";
import { on } from "events";

const handler = nextConnect({
  onError(error, req, res) {
    res.status(500).json({ error: error.message });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  },
});

handler.use(requireAuth);
handler.use(multer.single("avatar"));

handler.post(async (req, res) => {
  const { user } = req.user;

  if (!req.file) {
    return res.status(400).json({ error: "Please upload a file" });
  }

  const avatarPath = "/avatars/${req.file.filename}";

  try {
    if (user.profilePicture) {
      const oldAvatarPath = path.join(
        process.cwd(),
        "public",
        user.profilePicture
      );
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
        console.log("Old avatar deleted");
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { profilePicture: avatarPath },
    });

    res.status(200).json({ message: "Avatar uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;