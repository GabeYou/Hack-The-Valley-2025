import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const userCount = await prisma.user.count();
    return new Response(JSON.stringify({ count: userCount }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch user count' }), { status: 500 });
  }
}

