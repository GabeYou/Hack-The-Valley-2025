import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const openBountiesCount = await prisma.task.count({
      where: {
        status: 'open',
      },
    });
    return new Response(JSON.stringify({ openBounties: openBountiesCount }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch open bounties count' }), { status: 500 });
  }
}

