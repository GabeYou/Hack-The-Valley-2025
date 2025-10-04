import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  const { name, email, password, address, phoneNumber } = await req.json();
  const emailLower = email?.toLowerCase();
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
    try {
      const { userId } = jwt.verify(token, JWT_SECRET);
      const updateUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          name: name,
          email: email,
          passwordHash: await bcrypt.hash(password, 10)
        },
      })
      return new Response(JSON.stringify('Success'), { status: 200 });
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
}
