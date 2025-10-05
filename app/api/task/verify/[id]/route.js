import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

// GET /api/task/verify/[id]
// Public: returns task details and the submitted proof image as a hex string for the task's volunteer, if present
export async function GET(_req, { params }) {
  try {
    const { id } = params || {};
    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Task id is required' }), { status: 400 });
    }

    // Load task core details
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        bountyTotal: true,
        status: true,
        effortLevel: true,
        createdAt: true,
        postedBy: { select: { id: true, name: true, email: true } },
        volunteers: {
          select: {
            id: true,
            joinedAt: true,
            completed: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
    }

    // Solo assumption: at most one volunteer
    const volunteerRow = await prisma.taskVolunteer.findFirst({
      where: { taskId: id },
      select: { id: true, proofUrl: true, completed: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });

    let proofHex = null;
    if (volunteerRow?.proofUrl) {
      // Hex-encode the bytes so it can be safely transported as a JSON string
      // Client can decode with Buffer.from(hex, 'hex') or similar
      proofHex = Buffer.from(volunteerRow.proofUrl).toString('hex');
    }

    return new Response(
      JSON.stringify({
        task,
        volunteer: volunteerRow
          ? {
              id: volunteerRow.id,
              completed: volunteerRow.completed,
              user: volunteerRow.user,
            }
          : null,
        proofHex,
      })
    );
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
