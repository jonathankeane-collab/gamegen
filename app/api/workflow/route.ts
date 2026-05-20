import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createVercel } from '@ai-sdk/vercel'
import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 300

// Shared in-memory store for polling
export const runStore: Record<string, {
  phase: string
  html?: string
  error?: string
  failedStep?: number
}> = {}

function getGateway() {
  return createVercel({
    baseURL: process.env.AI_GATEWAY_URL ?? 'https://ai-gateway.vercel.sh/v1',
    apiKey: process.env.AI_GATEWAY_TOKEN ?? '',
  })
}

async function runWorkflow(runId: string, game: string, twist: string) {
  // ── STEP 1: AI Gateway ──────────────────────────────────────────────
  runStore[runId] = { phase: 'gateway' }
  let gameCode = ''
  try {
    const gateway = getGateway()
    const { text } = await generateText({
      model: gateway('claude-3-5-sonnet-20241022'),
      system: `You are an expert game developer. Generate a complete, self-contained HTML/JS game.
STRICT RULES:
- Return ONLY valid HTML. Start with <!DOCTYPE html>. No markdown, no code fences, no explanation.
- All CSS and JS must be inline. Zero external dependencies.
- Game must run inside a sandboxed iframe (no localStorage, no fetch)
- Dark theme. Polished visuals. Score display. On-screen instructions.
- Apply the twist deeply: visuals, text, mechanics`,
      prompt: `Create a fully playable ${game} game${twist ? ` with this twist: "${twist}"` : ''}.
Infuse the twist into every aspect: visual style, colors, game objects, win/lose messages.`,
    })
    gameCode = text.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI Gateway failed'
    runStore[runId] = { phase: 'error', error: msg, failedStep: 1 }
    return
  }

  // ── STEP 2: Sandbox ──────────────────────────────────────────────────
  runStore[runId] = { phase: 'sandbox' }
  try {
    const sandbox = await Sandbox.create({ runtime: 'node22' })
    try {
      const checkScript = `
const code = ${JSON.stringify(gameCode)};
const checks = {
  hasDoctype: /<!doctype html>/i.test(code),
  hasScript: code.includes('<script'),
  hasBody: code.includes('<body'),
  sizeOk: code.length > 200,
};
const passed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ passed, checks, length: code.length }));
`
      const result = await sandbox.runCommand({ cmd: 'node', args: ['-e', checkScript] })
      const out = await result.stdout()
      if (out) {
        try {
          const parsed = JSON.parse(out.trim())
          if (!parsed.passed) console.warn('Sandbox validation warnings:', parsed.checks)
        } catch { /* continue */ }
      }
    } finally {
      await sandbox.stop().catch(() => {})
    }
  } catch (err) {
    console.error('Sandbox error (non-fatal):', err)
  }

  // ── STEP 3: Function ─────────────────────────────────────────────────
  runStore[runId] = { phase: 'function' }
  await new Promise(r => setTimeout(r, 300))
  runStore[runId] = { phase: 'done', html: gameCode }
}

export async function POST(req: NextRequest) {
  const { game, twist, runId } = await req.json()
  if (!runId || !game) {
    return NextResponse.json({ error: 'game and runId required' }, { status: 400 })
  }
  runStore[runId] = { phase: 'workflow' }
  runWorkflow(runId, game, twist ?? '').catch(console.error)
  return NextResponse.json({ success: true, runId })
}
