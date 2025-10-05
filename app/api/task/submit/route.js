import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/task/submit
// Accepts multipart/form-data with fields:
// - taskId: string
// - file: image/file to store as bytes in TaskVolunteer.proofUrl
export async function POST(req) {
  try {
    // Parse form data
    const form = await req.formData();
    const taskId = form.get('taskId');
    const file = form.get('file');

    if (!taskId || typeof taskId !== 'string') {
      return new Response(JSON.stringify({ error: 'taskId is required' }), { status: 400 });
    }
    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'file is required' }), { status: 400 });
    }

    // Auth: token from cookie first
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

    // Ensure task exists and find volunteer row for this user
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, status: true },
    });
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    const volunteer = await prisma.taskVolunteer.findFirst({
      where: { taskId, userId },
      select: { id: true },
    });
    if (!volunteer) {
      return new Response(JSON.stringify({ error: 'Only the assigned volunteer may submit proof' }), { status: 403 });
    }

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Update proof and move task to in_review atomically
    const result = await prisma.$transaction(async (tx) => {
      const updatedVolunteer = await tx.taskVolunteer.update({
        where: { id: volunteer.id },
        data: { proofUrl: buffer },
        select: { id: true },
      });

      // Only allow transition from in_progress -> in_review; if currently open, reject
      const current = await tx.task.findUnique({ where: { id: taskId }, select: { status: true } });
      if (!current) throw new Error('TASK_NOT_FOUND');
      if (current.status !== 'in_progress' && current.status !== 'in_review') {
        // To be lenient, allow re-submission if already in_review; otherwise block
        throw new Error('TASK_NOT_IN_PROGRESS');
      }

      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: { status: 'in_review' },
        select: { id: true, status: true },
      });

      return { volunteer: updatedVolunteer, task: updatedTask };
    });

    return new Response(JSON.stringify(result), { status: 201 });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'TASK_NOT_FOUND') {
        return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
      }
      if (e.message === 'TASK_NOT_IN_PROGRESS') {
        return new Response(JSON.stringify({ error: 'Task is not in progress and cannot be submitted' }), { status: 409 });
      }
    }
    return new Response(
      JSON.stringify({ error: 'Failed to submit task proof', details: e?.message }),
      { status: 500 }
    );
  }
}
