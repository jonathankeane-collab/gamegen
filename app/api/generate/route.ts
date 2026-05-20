import { NextRequest, NextResponse } from 'next/server'
import { runStore } from '../store'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { game, twist } = await req.json()

  if (!game) {
    return NextResponse.json({ error: 'Game is required' }, { status: 400 })
  }

  const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  runStore[runId] = { phase: 'workflow' }

  // Kick off workflow in background
  const workflowUrl = `${req.nextUrl.origin}/api/workflow`
  fetch(workflowUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ game, twist, runId }),
  }).catch(console.error)

  return NextResponse.json({ runId })
}
