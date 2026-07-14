import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'XTREME-SCRAPER | Intelligence Platform',
  description: 'Asyncio swarm scraping system with Base44 AI agent integration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
