import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(req: Request) {
  try {
    const { id, email } = await req.json()

    if (!id && !email) {
      return new Response(
        JSON.stringify({ error: 'Must provide either id or email' }),
        { status: 400 }
      )
    }

    // Delete by id if provided, else fallback to email
    const where = id ? { id } : { email: email.toLowerCase() }

    const existing = await prisma.user.findUnique({ where })
    if (!existing) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      )
    }

    await prisma.user.delete({ where })

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      { status: 200 }
    )
  } catch (err: any) {
    console.error('Delete user error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}
