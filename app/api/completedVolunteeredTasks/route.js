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
  const completedVolunteeredTasks = await prisma.taskVolunteer.findMany({
    where: { userId, completed: true },
    include: {
      task: {
        select: {
          bountyTotal: true,
        },
      },
    },
  });

  // Sum the bountyTotal from each completed task
  const totalEarned = completedVolunteeredTasks.reduce((sum, volunteerRecord) => {
    return sum + (volunteerRecord.task?.bountyTotal || 0);
  }, 0);

  return new Response(JSON.stringify({ totalEarned }), { status: 200 });
}
