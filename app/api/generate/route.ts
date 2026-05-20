import { NextRequest, NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { gameGenWorkflow } from '../../workflow/gameGen'
import { runStore } from '../workflow/route'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { game, twist } = await req.json()

  if (!game) {
    return NextResponse.json({ error: 'Game is required' }, { status: 400 })
  }

  try {
    const run = await start(gameGenWorkflow, [{ game, twist: twist ?? '' }])
    const runId = run.runId

    // Track in store for polling
    runStore[runId] = { phase: 'workflow' }

    // Listen for result async
    run.returnValue.then((html: unknown) => {
      runStore[runId] = { phase: 'done', html: html as string }
    }).catch((err: Error) => {
      runStore[runId] = { phase: 'error', error: err.message }
    })

    return NextResponse.json({ runId })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to start workflow'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
