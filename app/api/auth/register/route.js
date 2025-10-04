import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req) {
  const { name, email, password, address, phoneNumber } = await req.json();
  const emailLower = email?.toLowerCase();
  if (!name || !emailLower || !password || !phoneNumber) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: emailLower, passwordHash, address: address || '', phoneNumber },
  });
  return new Response(JSON.stringify({ id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber }), { status: 201 });
}
