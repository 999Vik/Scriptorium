import { requireAuth } from "../../../lib/auth";
import prisma from "../../../lib/prisma";

const handler = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    const { user } = req.user;

    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profilePicture: true,
                phoneNumber: true,
              },
        });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.status(200).json({ profile });
    } catch (error) {
        console.error("Error getting profile:", error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
}

export default requireAuth(handler);
