import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// GET /api/completedBounties
// Returns the count of completed tasks the authenticated user has volunteered on
export async function GET(req) {
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

  // Optional: ensure user exists (helps differentiate bad tokens)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  const completedBounties = await prisma.taskVolunteer.count({
    where: { userId, completed: true },
  });

  return new Response(JSON.stringify({ completedBounties }), { status: 200 });
}

