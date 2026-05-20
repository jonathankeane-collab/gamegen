import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createVercel } from '@ai-sdk/vercel'
import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const { game, twist } = await req.json()

  if (!game) {
    return NextResponse.json({ error: 'Game is required' }, { status: 400 })
  }

  try {
    // Step 1: AI Gateway
    const gateway = createVercel({
      baseURL: process.env.AI_GATEWAY_URL ?? 'https://ai-gateway.vercel.sh/v1',
      apiKey: process.env.AI_GATEWAY_TOKEN ?? '',
    })
    const { text } = await generateText({
      model: gateway('anthropic/claude-sonnet-4.5'),
      system: 'You are an expert game developer. Generate a complete, self-contained HTML/JS game. Return ONLY valid HTML starting with <!DOCTYPE html>. No markdown. Dark theme. Apply the twist deeply into visuals, mechanics, and narrative.',
      prompt: `Create a fully playable ${game} game${twist ? ` with this twist: "${twist}"` : ''}.`,
    })
    const gameCode = text.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()

    // Step 2: Sandbox validation
    try {
      const sandbox = await Sandbox.create({ runtime: 'node22' })
      try {
        await sandbox.runCommand({
          cmd: 'node',
          args: ['-e', `const c=${JSON.stringify(gameCode)};console.log(JSON.stringify({ok:/<!doctype/i.test(c),len:c.length}))`],
        })
      } finally {
        await sandbox.stop().catch(() => {})
      }
    } catch (err) {
      console.error('Sandbox error (non-fatal):', err)
    }

    // Return the game directly — no polling needed
    return NextResponse.json({ html: gameCode })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed'
    console.error('Generate error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
