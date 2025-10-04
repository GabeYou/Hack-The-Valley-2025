import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req) {
  const { email, password } = await req.json();
  const emailLower = email?.toLowerCase();
  if (!emailLower || !password) {
    return new Response(JSON.stringify({ error: 'Missing email or password' }), { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  return new Response(
    JSON.stringify({ id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber }),
    {
      status: 200,
      headers: {
        'Set-Cookie': cookie,
        'Content-Type': 'application/json',
      },
    }
  );
}
