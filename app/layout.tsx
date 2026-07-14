import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "XTREME SCRAPER — Lead Discovery Engine",
  description: "The most powerful lead discovery tool for business owners. Search any industry, any city, any source.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "XScraper" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#090B10" },
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var saved = localStorage.getItem('xscraper-theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var dark = saved ? saved === 'dark' : prefersDark;
              document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            } catch(e) {}
          })()
        `}} />
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </body>
    </html>
  )
}
