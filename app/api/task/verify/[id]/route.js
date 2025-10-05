import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

function detectMime(bytes) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return 'image/png';
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'image/jpeg';
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  }
  return 'application/octet-stream';
}

// GET /api/task/verify/[id]
// Returns the submitted proof image directly
export async function GET(_req, { params }) {
  try {
    const { id } = params || {};
    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Task id is required' }), { status: 400 });
    }

    const volunteerRow = await prisma.taskVolunteer.findFirst({
      where: { taskId: id },
      select: { proofUrl: true },
      orderBy: { joinedAt: 'asc' },
    });

    if (!volunteerRow || !volunteerRow.proofUrl) {
      return new Response('No proof image found for this task', { status: 404 });
    }

    const imageBuffer = Buffer.from(volunteerRow.proofUrl);
    const mimeType = detectMime(imageBuffer);

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': imageBuffer.length.toString(),
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch verification data', details: e?.message }),
      { status: 500 }
    );
  }
}

// POST /api/task/verify/[id]
// Marks the task as completed, marks the volunteer as completed, and transfers bounty to the volunteer
export async function POST(req, { params }) {
  try {
    const { id } = params || {};
    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Task id is required' }), { status: 400 });
    }
    // Parse body (should be JSON, but we only need id from params)
    // Find the task
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        bountyTotal: true,
        volunteers: {
          select: {
            id: true,
            userId: true,
            completed: true,
          },
        },
      },
    });
    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }
    if (task.status === 'completed') {
      return new Response(JSON.stringify({ error: 'Task already completed' }), { status: 400 });
    }
    // Only 1 volunteer is assumed
    const volunteer = task.volunteers[0];
    if (!volunteer) {
      return new Response(JSON.stringify({ error: 'No volunteer for this task' }), { status: 400 });
    }
    // Transaction: update task, volunteer, and user wallet
    const updated = await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: { status: 'completed' },
      }),
      prisma.taskVolunteer.update({
        where: { id: volunteer.id },
        data: { completed: true },
      }),
      prisma.user.update({
        where: { id: volunteer.userId },
        data: { walletBalance: { increment: task.bountyTotal } },
      }),
    ]);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Failed to verify and complete task', details: e?.message }),
      { status: 500 }
    );
  }
}
