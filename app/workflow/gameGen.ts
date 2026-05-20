'use workflow'
import { generateText } from 'ai'
import { createVercel } from '@ai-sdk/vercel'
import { Sandbox } from '@vercel/sandbox'

export async function gameGenWorkflow(input: { game: string; twist: string }) {
  const { game, twist } = input

  // Step 1: AI Gateway — generate game code
  const gateway = createVercel({
    baseURL: process.env.AI_GATEWAY_URL ?? 'https://ai-gateway.vercel.sh/v1',
    apiKey: process.env.AI_GATEWAY_TOKEN ?? '',
  })

  const { text } = await generateText({
    model: gateway('claude-3-5-sonnet-20241022'),
    system: 'You are an expert game developer. Generate a complete, self-contained HTML/JS game. Return ONLY valid HTML starting with <!DOCTYPE html>. Dark theme. Apply the twist deeply into visuals, mechanics, and narrative.',
    prompt: `Create a fully playable ${game} game${twist ? ` with this twist: "${twist}"` : ''}.`,
  })

  const gameCode = text.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()

  // Step 2: Sandbox — validate the code
  const sandbox = await Sandbox.create({ runtime: 'node22' })
  try {
    const result = await sandbox.runCommand({
      cmd: 'node',
      args: ['-e', `const c=${JSON.stringify(gameCode)};console.log(JSON.stringify({ok:/<!doctype/i.test(c)&&c.includes('<script'),len:c.length}))`],
    })
    const out = await result.stdout()
    console.log('Sandbox validation:', out)
  } finally {
    await sandbox.stop().catch(() => {})
  }

  // Step 3: Return finalized HTML
  return gameCode
}
