import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'XTREME-SCRAPER | Intelligence Platform',
  description: 'Asyncio swarm scraping system with Base44 AI agent integration',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
