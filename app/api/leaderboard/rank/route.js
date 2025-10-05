import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(req) {
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
        return new Response(JSON.stringify({ rank: 'N/A' }), { status: 200 });
    }

    let userId;
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
    } catch {
        return new Response(JSON.stringify({ rank: 'N/A' }), { status: 200 });
    }

    try {
        const topCompleted = await prisma.taskVolunteer.groupBy({
            by: ['userId'],
            where: { completed: true },
            _count: {
                taskId: true,
            },
            orderBy: {
                _count: {
                    taskId: 'desc',
                },
            },
        });

        const userRank = topCompleted.findIndex(entry => entry.userId === userId);

        if (userRank === -1) {
            return new Response(JSON.stringify({ rank: 'N/A' }), { status: 200 });
        }

        return new Response(JSON.stringify({ rank: userRank + 1 }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch leaderboard rank' }), { status: 500 });
    }
}

