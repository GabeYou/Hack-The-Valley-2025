import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req) {
  // Authenticate user (reuse logic from /auth/me)
  const cookie = req.headers.get('cookie');
  let token = null;
  if (cookie) {
    const match = cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }
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
    ({ userId } = jwt.verify(token, JWT_SECRET));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
  }

  // Get all volunteered tasks where completed is true
  const volunteered = await prisma.taskVolunteer.findMany({
    where: { userId, completed: true },
    select: { taskId: true },
  });

  const taskIds = volunteered.map(v => v.taskId);

  // Sum the amount from TaskContribution for all these tasks
  let totalEarned = 0;
  if (taskIds.length > 0) {
    const sum = await prisma.taskContribution.aggregate({
      where: { taskId: { in: taskIds } },
      _sum: { amount: true },
    });
    totalEarned = sum._sum.amount || 0;
  }

  return new Response(JSON.stringify({ totalEarned }), { status: 200 });
}
