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
  // New: normalize optional links (array of strings or single string)
  const linksInput = Array.isArray(body.links)
    ? body.links
    : typeof body.links === 'string'
    ? [body.links]
    : [];
  const cleanLinks = linksInput
    .map((l) => (typeof l === 'string' ? l.trim() : ''))
    .filter((l) => l.length > 0)
    .slice(0, 20); // cap to a reasonable number

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

  // Create new task (allow lat/lon 0 values; allow zero bounty; require integer)
  if (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    title &&
    description &&
    Number.isFinite(bountyTotal) &&
    Number.isInteger(bountyTotal) &&
    bountyTotal >= 0
  ) {
    try {
      const location = `${lat},${lon}`;
      const task = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
        if (!user) throw new Error('USER_NOT_FOUND');
        if (bountyTotal > 0 && user.walletBalance < bountyTotal) {
          throw new Error('INSUFFICIENT_FUNDS');
        }
        if (bountyTotal > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { walletBalance: { decrement: bountyTotal } },
          });
        }
        const created = await tx.task.create({
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
            ...(cleanLinks.length > 0
              ? {
                  links: {
                    create: cleanLinks.map((url) => ({ url })),
                  },
                }
              : {}),
          },
          include: { contributions: true, links: true },
        });
        return created;
      });
      return new Response(JSON.stringify({ task }), { status: 201 });
    } catch (e) {
      if (e instanceof Error && e.message === 'INSUFFICIENT_FUNDS') {
        return new Response(JSON.stringify({ error: 'Insufficient funds' }), { status: 400 });
      }
      if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }
      return new Response(JSON.stringify({ error: 'Failed to create task' }), { status: 500 });
    }
  }

  // Contribute to existing task (amount must be integer >= 0)
  if (body.taskId && Number.isFinite(amount) && Number.isInteger(amount) && amount >= 0) {
    // Check if task exists
    const task = await prisma.task.findUnique({ where: { id: body.taskId } });
    if (!task) return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });

    try {
      const { contribution, contributionsList } = await prisma.$transaction(async (tx) => {
        // Ensure user exists and has enough balance when amount > 0
        const user = await tx.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
        if (!user) throw new Error('USER_NOT_FOUND');
        if (amount > 0 && user.walletBalance < amount) {
          throw new Error('INSUFFICIENT_FUNDS');
        }
        if (amount > 0) {
          // Decrement balance first; entire tx will roll back if later steps fail
          await tx.user.update({ where: { id: userId }, data: { walletBalance: { decrement: amount } } });
        }

        // Check if user already contributed
        const existing = await tx.taskContribution.findFirst({ where: { taskId: task.id, userId } });

        let updated;
        if (!existing) {
          updated = await tx.task.update({
            where: { id: task.id },
            data: {
              contributions: {
                create: { userId, amount },
              },
              // increment by 0 is a no-op but safe
              bountyTotal: { increment: amount },
            },
            include: { contributions: true },
          });
        } else {
          updated = await tx.task.update({
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
        }
        const c = !existing
          ? updated.contributions.find((x) => x.userId === userId)
          : updated.contributions.find((x) => x.id === existing.id);
        return { contribution: c, contributionsList: updated.contributions };
      });

      return new Response(JSON.stringify({ contribution, contributions: contributionsList }), { status: 201 });
    } catch (e) {
      if (e instanceof Error && e.message === 'INSUFFICIENT_FUNDS') {
        return new Response(JSON.stringify({ error: 'Insufficient funds' }), { status: 400 });
      }
      if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }
      return new Response(JSON.stringify({ error: 'Failed to contribute' }), { status: 500 });
    }
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
        status: true,
        postedById: true, // include creator id for frontend filtering/UI
        contributions: {
          select: {
            id: true,
            amount: true,
            timestamp: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
        links: {
          select: { id: true, url: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return new Response(JSON.stringify(tasks));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tasks' }), { status: 500 });
  }
}
