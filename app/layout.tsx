import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GAMEGEN // AI ARCADE',
  description: 'Generate any game with an AI twist. Powered by Vercel.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
