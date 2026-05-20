import { NextRequest, NextResponse } from 'next/server'
import { runStore } from '../workflow/route'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { game, twist } = await req.json()

  if (!game) {
    return NextResponse.json({ error: 'Game is required' }, { status: 400 })
  }

  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // Kick off workflow in background via internal fetch
  const workflowUrl = `${req.nextUrl.origin}/api/workflow`
  fetch(workflowUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game, twist, runId }),
  }).catch(console.error)

  return NextResponse.json({ runId })
}
