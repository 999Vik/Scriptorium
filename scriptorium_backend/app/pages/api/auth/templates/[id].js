import prisma from '../../../lib/prisma';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const template = await prisma.codeTemplate.findUnique({
        where: { id: parseInt(id) },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.status(200).json(template);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve code template' });
    }
  } else if (req.method === 'PUT') {
    // Update template
    // Authenticate user and ensure they are the author
    // Similar to the create endpoint
  } else if (req.method === 'DELETE') {
    // Delete template
    // Authenticate user and ensure they are the author
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
