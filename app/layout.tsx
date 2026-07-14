import type { Metadata } from "next"
import "./globals.css"
export const metadata: Metadata = {
  title: "XTREME SCRAPER — AZ Lead Discovery",
  description: "Asyncio-powered lead scraper → Supabase pipeline",
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: "#090B10" }}>
      <body style={{ background: "#090B10", margin: 0, padding: 0, color: "white" }}>
        {children}
      </body>
    </html>
  )
}
