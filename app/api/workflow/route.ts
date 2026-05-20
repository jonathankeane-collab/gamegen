import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

// Shared in-memory store for polling (also updated by generate route)
export const runStore: Record<string, {
  phase: string
  html?: string
  error?: string
  failedStep?: number
}> = {}

// This route is kept for the status polling fallback
// Actual workflow execution is handled by Vercel Workflows runtime
// via the 'use workflow' directive in app/workflow/gameGen.ts
export async function GET() {
  return NextResponse.json({ ok: true })
}
