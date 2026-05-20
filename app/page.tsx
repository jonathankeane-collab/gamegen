'use client'

import { useState } from 'react'

const GAMES = [
  { id: 'snake', label: 'SNAKE', icon: '🐍' },
  { id: 'pong', label: 'PONG', icon: '🏓' },
  { id: 'tictactoe', label: 'TIC TAC TOE', icon: '❌' },
  { id: 'breakout', label: 'BREAKOUT', icon: '🧱' },
  { id: '2048', label: '2048', icon: '🔢' },
  { id: 'memory', label: 'MEMORY MATCH', icon: '🃏' },
]

const TWIST_EXAMPLES = [
  'but with cats 🐱',
  'set in space 🚀',
  'everything is upside down 🙃',
  'but it\'s underwater 🌊',
  'in a haunted house 👻',
  'but make it cowboy themed 🤠',
]

type Phase = 'idle' | 'gateway' | 'sandbox' | 'function' | 'done' | 'error'

interface StepStatus {
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
  detail?: string
}

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [twist, setTwist] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [gameHtml, setGameHtml] = useState('')
  const [steps, setSteps] = useState<StepStatus[]>([
    { label: 'WORKFLOW INIT', status: 'pending' },
    { label: 'AI GATEWAY · CODE GEN', status: 'pending' },
    { label: 'SANDBOX · LINT & VALIDATE', status: 'pending' },
    { label: 'FUNCTION · RETURN GAME', status: 'pending' },
  ])
  const [twistPlaceholder] = useState(
    TWIST_EXAMPLES[Math.floor(Math.random() * TWIST_EXAMPLES.length)]
  )

  const updateStep = (index: number, update: Partial<StepStatus>) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, ...update } : s))
  }

  const generate = async () => {
    if (!selectedGame || phase !== 'idle') return

    setGameHtml('')
    setPhase('gateway')
    setSteps([
      { label: 'WORKFLOW INIT', status: 'done', detail: 'Started ✓' },
      { label: 'AI GATEWAY · CODE GEN', status: 'running', detail: 'Routing through AI Gateway...' },
      { label: 'SANDBOX · LINT & VALIDATE', status: 'pending' },
      { label: 'FUNCTION · RETURN GAME', status: 'pending' },
    ])

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: selectedGame, twist: twist || twistPlaceholder }),
      })

      setPhase('sandbox')
      updateStep(1, { status: 'done', detail: 'Code generated ✓' })
      updateStep(2, { status: 'running', detail: 'Validating in ephemeral VM...' })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setPhase('function')
      updateStep(2, { status: 'done', detail: 'Lint passed ✓' })
      updateStep(3, { status: 'running', detail: 'Returning through Edge Function...' })

      await new Promise(r => setTimeout(r, 300))

      updateStep(3, { status: 'done', detail: 'Game ready ✓' })
      setGameHtml(data.html)
      setPhase('done')

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setPhase('error')
      setSteps(prev => prev.map(s =>
        s.status === 'running' ? { ...s, status: 'error', detail: msg } : s
      ))
    }
  }

  const reset = () => {
    setPhase('idle')
    setGameHtml('')
    setSteps([
      { label: 'WORKFLOW INIT', status: 'pending' },
      { label: 'AI GATEWAY · CODE GEN', status: 'pending' },
      { label: 'SANDBOX · LINT & VALIDATE', status: 'pending' },
      { label: 'FUNCTION · RETURN GAME', status: 'pending' },
    ])
  }

  const isRunning = ['gateway', 'sandbox', 'function'].includes(phase)

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', paddingTop: '1rem' }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: 900, color: 'var(--neon-cyan)', textShadow: 'var(--glow-cyan)', animation: 'pulse-glow 3s ease-in-out infinite, flicker 8s infinite', letterSpacing: '0.15em', lineHeight: 1 }}>
          GAME<span style={{ color: 'var(--neon-pink)', textShadow: 'var(--glow-pink)' }}>GEN</span>
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '0.3em', marginTop: '0.5rem' }}>
          AI · ARCADE · GENERATOR // POWERED BY VERCEL
        </div>
      </header>

      {phase !== 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Game selector */}
          <section>
            <div style={{ color: 'var(--neon-yellow)', fontSize: '0.7rem', letterSpacing: '0.3em', marginBottom: '0.75rem', fontFamily: 'Orbitron, monospace' }}>01 // SELECT GAME</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              {GAMES.map(game => (
                <button key={game.id} onClick={() => !isRunning && setSelectedGame(game.id)} disabled={isRunning}
                  style={{ padding: '1rem', background: selectedGame === game.id ? 'rgba(0, 245, 255, 0.08)' : 'var(--surface)', border: selectedGame === game.id ? '1px solid var(--neon-cyan)' : '1px solid var(--border)', boxShadow: selectedGame === game.id ? 'var(--glow-cyan)' : 'none', borderRadius: '4px', cursor: isRunning ? 'not-allowed' : 'pointer', color: selectedGame === game.id ? 'var(--neon-cyan)' : 'var(--text)', fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 700, textAlign: 'center', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: isRunning ? 0.5 : 1 }}>
                  <span style={{ fontSize: '1.5rem' }}>{game.icon}</span>
                  {game.label}
                </button>
              ))}
            </div>
          </section>

          {/* Twist input */}
          <section>
            <div style={{ color: 'var(--neon-yellow)', fontSize: '0.7rem', letterSpacing: '0.3em', marginBottom: '0.75rem', fontFamily: 'Orbitron, monospace' }}>02 // ADD A TWIST</div>
            <input type="text" value={twist} onChange={e => setTwist(e.target.value)} disabled={isRunning} placeholder={twistPlaceholder}
              style={{ width: '100%', padding: '0.9rem 1rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--neon-cyan)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </section>

          {/* Generate button */}
          <button onClick={generate} disabled={!selectedGame || isRunning}
            style={{ padding: '1.1rem 2rem', background: 'transparent', border: selectedGame && !isRunning ? '2px solid var(--neon-pink)' : '2px solid var(--border)', boxShadow: selectedGame && !isRunning ? 'var(--glow-pink)' : 'none', borderRadius: '4px', color: selectedGame && !isRunning ? 'var(--neon-pink)' : 'var(--text-dim)', fontFamily: 'Orbitron, monospace', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.3em', cursor: selectedGame && !isRunning ? 'pointer' : 'not-allowed', transition: 'all 0.2s', width: '100%' }}>
            {isRunning ? '[ GENERATING... ]' : '[ GENERATE GAME ]'}
          </button>
        </div>
      )}

      {/* Pipeline status */}
      {phase !== 'idle' && (
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1.25rem', animation: 'slide-in 0.3s ease' }}>
          <div style={{ color: 'var(--neon-yellow)', fontSize: '0.7rem', letterSpacing: '0.3em', marginBottom: '1rem', fontFamily: 'Orbitron, monospace' }}>PIPELINE STATUS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                <span style={{ width: '20px', textAlign: 'center', color: step.status === 'done' ? 'var(--neon-green)' : step.status === 'running' ? 'var(--neon-cyan)' : step.status === 'error' ? 'var(--neon-pink)' : 'var(--text-dim)', animation: step.status === 'running' ? 'blink 0.8s infinite' : 'none' }}>
                  {step.status === 'done' ? '✓' : step.status === 'running' ? '▶' : step.status === 'error' ? '✗' : '○'}
                </span>
                <span style={{ fontFamily: 'Orbitron, monospace', fontSize: '0.65rem', letterSpacing: '0.1em', color: step.status === 'pending' ? 'var(--text-dim)' : 'var(--text)', minWidth: '200px' }}>{step.label}</span>
                {step.detail && <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{step.detail}</span>}
              </div>
            ))}
          </div>
          {isRunning && (
            <div style={{ marginTop: '1rem', height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--neon-cyan)', boxShadow: 'var(--glow-cyan)', width: `${(steps.filter(s => s.status === 'done').length / steps.length) * 100}%`, transition: 'width 0.5s ease' }} />
            </div>
          )}
        </section>
      )}

      {/* Game iframe */}
      {phase === 'done' && gameHtml && (
        <section style={{ animation: 'slide-in 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ color: 'var(--neon-green)', fontSize: '0.7rem', letterSpacing: '0.3em', fontFamily: 'Orbitron, monospace', textShadow: 'var(--glow-green)' }}>
              ● GAME ONLINE // {GAMES.find(g => g.id === selectedGame)?.label} + &quot;{twist || twistPlaceholder}&quot;
            </div>
            <button onClick={reset} style={{ padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-dim)', fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', letterSpacing: '0.2em', cursor: 'pointer' }}>[ NEW GAME ]</button>
          </div>
          <div style={{ border: '1px solid var(--neon-green)', boxShadow: 'var(--glow-green)', borderRadius: '4px', overflow: 'hidden' }}>
            <iframe srcDoc={gameHtml} style={{ width: '100%', height: '600px', border: 'none', display: 'block', background: '#000' }} sandbox="allow-scripts" title="Generated Game" />
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[{ label: 'HOSTING', color: 'var(--neon-cyan)' }, { label: 'FUNCTION', color: 'var(--neon-cyan)' }, { label: 'AI GATEWAY', color: 'var(--neon-pink)' }, { label: 'WORKFLOW', color: 'var(--neon-yellow)' }, { label: 'SANDBOX', color: 'var(--neon-green)' }].map(p => (
              <div key={p.label} style={{ fontSize: '0.6rem', fontFamily: 'Orbitron, monospace', letterSpacing: '0.15em', color: p.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>● {p.label}</div>
            ))}
          </div>
        </section>
      )}

      {phase === 'error' && (
        <div style={{ padding: '1rem', background: 'rgba(255, 45, 120, 0.05)', border: '1px solid var(--neon-pink)', borderRadius: '4px', color: 'var(--neon-pink)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>SYSTEM ERROR // CHECK PIPELINE LOG ABOVE</span>
          <button onClick={reset} style={{ background: 'transparent', border: '1px solid var(--neon-pink)', color: 'var(--neon-pink)', padding: '0.3rem 0.8rem', fontFamily: 'Orbitron, monospace', fontSize: '0.6rem', letterSpacing: '0.2em', cursor: 'pointer', borderRadius: '4px' }}>RETRY</button>
        </div>
      )}

      <footer style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.65rem', letterSpacing: '0.2em', paddingBottom: '1rem', fontFamily: 'Orbitron, monospace' }}>
        VERCEL · HOSTING · COMPUTE · AI GATEWAY · WORKFLOWS · SANDBOX
      </footer>
    </main>
  )
}
