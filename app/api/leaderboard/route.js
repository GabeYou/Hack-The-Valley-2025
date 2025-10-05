import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Top 20 users by number of completed tasks
    const completedGroups = await prisma.taskVolunteer.groupBy({
      by: ['userId'],
      where: { completed: true },
      _count: { userId: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 20,
    });

    const completedUserIds = completedGroups.map((g) => g.userId);
    const completedUsers = await prisma.user.findMany({
      where: { id: { in: completedUserIds } },
      select: { id: true, name: true, email: true, reputation: true },
    });
    const completedUserMap = new Map(completedUsers.map((u) => [u.id, u]));

    const topCompleted = completedGroups.map((g) => ({
      user: completedUserMap.get(g.userId) || { id: g.userId },
      completedCount: g._count.userId,
    }));

    // Top 20 users by total money earned from completed tasks
    // Assumption: tasks are solo; the volunteer receives Task.bountyTotal upon completion.
    const completedVolunteerRows = await prisma.taskVolunteer.findMany({
      where: { completed: true },
      select: { userId: true, task: { select: { bountyTotal: true } } },
    });

    const earnedByUser = new Map();
    for (const row of completedVolunteerRows) {
      const current = earnedByUser.get(row.userId) || 0;
      earnedByUser.set(row.userId, current + (row.task?.bountyTotal ?? 0));
    }

    const topEarnedPairs = Array.from(earnedByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const topEarnedUserIds = topEarnedPairs.map(([userId]) => userId);
    const earnedUsers = await prisma.user.findMany({
      where: { id: { in: topEarnedUserIds } },
      select: { id: true, name: true, email: true, reputation: true, walletBalance: true },
    });
    const earnedUserMap = new Map(earnedUsers.map((u) => [u.id, u]));

    const topEarned = topEarnedPairs.map(([userId, totalEarned]) => ({
      user: earnedUserMap.get(userId) || { id: userId },
      totalEarned,
    }));

    return new Response(JSON.stringify({ topCompleted, topEarned }));
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Failed to compute leaderboard', details: e?.message }),
      { status: 500 }
    );
  }
}
