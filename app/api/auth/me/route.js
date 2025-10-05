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
        return new Response(JSON.stringify({ error: 'Missing or invalid token' }), { status: 401 });
    }
    try {
        const { userId } = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                volunteeredTasks: {
                    include: {
                        task: {
                            include: {
                                postedBy: {
                                    select: {
                                        id: true,
                                        email: true,
                                        name: true,
                                        phoneNumber: true,
                                    }
                                },
                            },
                        },
                    },
                },
                contributions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                                phoneNumber: true,
                            }
                        }
                    }
                },
            },
        });
        if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        return new Response(
            JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                phoneNumber: user.phoneNumber,
                volunteeredTasks: user.volunteeredTasks,
                contributions: user.contributions,
            }),
            { status: 200 }
        );
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
}
