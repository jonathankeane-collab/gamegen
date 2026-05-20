import { NextRequest, NextResponse } from 'next/server'
import { runStore } from '../workflow/route'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const runId = req.nextUrl.searchParams.get('runId')

  if (!runId) {
    return NextResponse.json({ error: 'runId required' }, { status: 400 })
  }

  const state = runStore[runId]

  if (!state) {
    return NextResponse.json({ phase: 'pending' })
  }

  return NextResponse.json(state)
}
