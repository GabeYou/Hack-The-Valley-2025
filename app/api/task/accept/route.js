import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { taskId } = await req.json();
    if (!taskId || typeof taskId !== 'string') {
      return new Response(JSON.stringify({ error: 'taskId is required' }), { status: 400 });
    }

    // Extract token from cookie first
    const cookie = req.headers.get('cookie');
    let token = null;
    if (cookie) {
      const match = cookie.match(/token=([^;]+)/);
      if (match) token = match[1];
    }
    // Fallback to Authorization header
    if (!token) {
      const auth = req.headers.get('authorization');
      if (auth && auth.startsWith('Bearer ')) {
        token = auth.slice(7);
      }
    }
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing or invalid token' }), { status: 401 });
    }

    let userId;
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      userId = payload.userId || payload.id;
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // Atomically ensure no volunteer yet and set status to in_progress
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Load task with status and volunteer count
        const task = await tx.task.findUnique({
          where: { id: taskId },
          select: { id: true, status: true, _count: { select: { volunteers: true } } },
        });
        if (!task) {
          throw new Error('TASK_NOT_FOUND');
        }
        if (task.status !== 'open') {
          // Only allow accepting open tasks
          throw new Error('TASK_NOT_OPEN');
        }
        if (task._count.volunteers > 0) {
          // Solo-only guard: someone already volunteering
          throw new Error('TASK_ALREADY_VOLUNTEERED');
        }

        const volunteer = await tx.taskVolunteer.create({
          data: {
            taskId,
            userId,
          },
        });

        const updatedTask = await tx.task.update({
          where: { id: taskId },
          data: { status: 'in_progress' },
          select: { id: true, status: true },
        });

        return { volunteer, task: updatedTask };
      });

      return new Response(JSON.stringify(result), { status: 201 });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'TASK_NOT_FOUND') {
          return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
        }
        if (err.message === 'TASK_NOT_OPEN') {
          return new Response(JSON.stringify({ error: 'Task is not open for acceptance' }), { status: 409 });
        }
        if (err.message === 'TASK_ALREADY_VOLUNTEERED') {
          return new Response(JSON.stringify({ error: 'Task already has a volunteer' }), { status: 409 });
        }
      }
      return new Response(JSON.stringify({ error: 'Failed to accept task' }), { status: 500 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to accept task', details: e?.message }), { status: 500 });
  }
}
