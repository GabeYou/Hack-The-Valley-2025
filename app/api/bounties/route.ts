import { NextResponse } from 'next/server'

export async function GET() {
  const exampleBounties = [
    {
      id: '1',
      title: 'Fix park bench',
      description: 'Repair broken bench near downtown park.',
      location: '37.7749,-122.4194'
    },
    {
      id: '2',
      title: 'Plant trees',
      description: 'Plant 10 trees in community area.',
      location: '37.7849,-122.4094'
    }
  ]

  return NextResponse.json(exampleBounties)
}
