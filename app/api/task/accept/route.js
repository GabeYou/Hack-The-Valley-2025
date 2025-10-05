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

    // Ensure the task exists
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    // Enforce solo-only: ensure no existing volunteer on this task
    const volunteerCount = await prisma.taskVolunteer.count({ where: { taskId } });
    if (volunteerCount > 0) {
      return new Response(JSON.stringify({ error: 'Task already has a volunteer' }), { status: 409 });
    }

    // Create the volunteer record
    const volunteer = await prisma.taskVolunteer.create({
      data: {
        taskId,
        userId,
      },
    });

    return new Response(JSON.stringify({ volunteer }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to accept task', details: e?.message }), { status: 500 });
  }
}

