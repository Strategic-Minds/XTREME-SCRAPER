import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import './globals.css'

export const metadata: Metadata = {
  title: 'XPS Intelligence | Go Beyond Google',
  description: 'Find source-backed companies, people, contacts, markets, signals, and opportunities. Understand why they matter and know what to do next.',
  manifest: '/manifest.json',
  applicationName: 'XPS Intelligence',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://xtreme-scraper.vercel.app'),
  openGraph: {
    title: 'XPS Intelligence',
    description: "Go Beyond Google. Find What Others Can't.",
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090909' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}<ServiceWorkerRegister /></body>
    </html>
  )
}
