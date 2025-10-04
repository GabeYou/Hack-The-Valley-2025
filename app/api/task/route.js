import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  const body = await req.json();
  // Normalize and validate input values
  const title = body.title?.trim();
  const description = body.description?.trim();
  const lat = body.lat !== undefined ? Number(body.lat) : undefined;
  const lon = body.lon !== undefined ? Number(body.lon) : undefined;
  const bountyTotal = body.bountyTotal !== undefined ? Number(body.bountyTotal) : undefined;
  const amount = body.amount !== undefined ? Number(body.amount) : undefined;

  // Try to get token from cookie first
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

  // Create new task (allow lat/lon 0 values; require positive bounty)
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    title &&
    description &&
    Number.isFinite(bountyTotal) &&
    bountyTotal > 0
  ) {
    const location = `${lat},${lon}`;
    const task = await prisma.task.create({
      data: {
        title,
        description,
        location,
        bountyTotal,
        effortLevel: 'solo',
        status: 'open',
        postedById: userId,
        contributions: {
          create: {
            userId,
            amount: bountyTotal,
          },
        },
      },
      include: { contributions: true },
    });
    return new Response(JSON.stringify({ task }), { status: 201 });
  }

  // Contribute to existing task (amount must be positive number)
  if (body.taskId && Number.isFinite(amount) && amount > 0) {
    // Check if task exists including current contributions
    const task = await prisma.task.findUnique({ where: { id: body.taskId }, include: { contributions: true } });
    if (!task) return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });

    const existing = task.contributions.find(c => c.userId === userId);

    let contribution;
    let contributionsList = [];

    // Use a transaction with nested writes to keep everything in sync
    await prisma.$transaction(async (tx) => {
      if (!existing) {
        const updated = await tx.task.update({
          where: { id: task.id },
          data: {
            contributions: {
              create: { userId, amount },
            },
            bountyTotal: { increment: amount },
          },
          include: { contributions: true },
        });
        contributionsList = updated.contributions;
        contribution = updated.contributions.find(c => c.userId === userId);
      } else {
        const updated = await tx.task.update({
          where: { id: task.id },
          data: {
            contributions: {
              update: {
                where: { id: existing.id },
                data: { amount: { increment: amount } },
              },
            },
            bountyTotal: { increment: amount },
          },
          include: { contributions: true },
        });
        contributionsList = updated.contributions;
        contribution = updated.contributions.find(c => c.id === existing.id);
      }
    });

    return new Response(JSON.stringify({ contribution, contributions: contributionsList }), { status: 201 });
  }

  return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
}

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        bountyTotal: true,
        contributions: {
          select: {
            id: true,
            amount: true,
            timestamp: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return new Response(JSON.stringify(tasks));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tasks' }), { status: 500 });
  }
}
