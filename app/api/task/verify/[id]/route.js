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
