import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createVercel } from '@ai-sdk/vercel'
import { Sandbox } from '@vercel/sandbox'
import { runStore } from '../store'

export const runtime = 'nodejs'
export const maxDuration = 300

async function runWorkflow(runId: string, game: string, twist: string) {
  // Step 1: AI Gateway
  runStore[runId] = { phase: 'gateway' }
  let gameCode = ''
  try {
    const gateway = createVercel({
      baseURL: process.env.AI_GATEWAY_URL ?? 'https://ai-gateway.vercel.sh/v1',
      apiKey: process.env.AI_GATEWAY_TOKEN ?? '',
    })
    const { text } = await generateText({
      model: gateway('claude-3-5-sonnet-20241022'),
      system: 'You are an expert game developer. Generate a complete, self-contained HTML/JS game. Return ONLY valid HTML starting with <!DOCTYPE html>. No markdown. Dark theme. Apply the twist deeply.',
      prompt: `Create a fully playable ${game} game${twist ? ` with this twist: "${twist}"` : ''}.`,
    })
    gameCode = text.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI Gateway failed'
    console.error('Gateway error:', msg)
    runStore[runId] = { phase: 'error', error: msg, failedStep: 1 }
    return
  }

  // Step 2: Sandbox
  runStore[runId] = { phase: 'sandbox' }
  try {
    const sandbox = await Sandbox.create({ runtime: 'node22' })
    try {
      const result = await sandbox.runCommand({
        cmd: 'node',
        args: ['-e', `const c=${JSON.stringify(gameCode)};console.log(JSON.stringify({ok:/<!doctype/i.test(c),len:c.length}))`],
      })
      console.log('Sandbox result:', await result.stdout())
    } finally {
      await sandbox.stop().catch(() => {})
    }
  } catch (err) {
    console.error('Sandbox error (non-fatal):', err)
  }

  // Step 3: Function
  runStore[runId] = { phase: 'function' }
  await new Promise(r => setTimeout(r, 300))
  runStore[runId] = { phase: 'done', html: gameCode }
}

export async function POST(req: NextRequest) {
  const { game, twist, runId } = await req.json()
  if (!runId || !game) return NextResponse.json({ error: 'game and runId required' }, { status: 400 })
  runStore[runId] = { phase: 'workflow' }
  runWorkflow(runId, game, twist ?? '').catch(console.error)
  return NextResponse.json({ success: true, runId })
}
