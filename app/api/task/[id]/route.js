import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/task/[id]
// Public: returns detailed info about a single task by id
export async function GET(_req, { params }) {
  try {
    const { id } = params || {};
    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Task id is required' }), { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        bountyTotal: true,
        status: true,
        effortLevel: true,
        createdAt: true,
        postedBy: { select: { id: true, name: true, email: true } },
        contributions: {
          select: {
            id: true,
            amount: true,
            timestamp: true,
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { timestamp: 'desc' },
        },
        volunteers: {
          select: {
            id: true,
            joinedAt: true,
            completed: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(task));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch task', details: e?.message }), { status: 500 });
  }
}

