// Shared in-memory store for workflow run state
// In production use Vercel KV for persistence across instances
export const runStore: Record<string, {
  phase: string
  html?: string
  error?: string
  failedStep?: number
}> = {}
