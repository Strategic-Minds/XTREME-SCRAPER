'use client';

import React from 'react';
import Link from 'next/link';
import TopNav from '../components/TopNav';
import LeadCard from '../components/LeadCard';
import { mockLeads } from '../lib/mockData';

export default function Home() {
  const [filteredLeads] = React.useState(mockLeads.slice(0, 6));

  return (
    <main className="flex min-h-[100dvh] w-full max-w-full flex-col overflow-x-clip overscroll-none bg-white text-black">
      <TopNav />

      <section className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-12 bg-white px-4 py-14 sm:px-6 sm:py-20 md:flex-row md:px-16">
        <div className="w-full min-w-0 max-w-xl flex-1 space-y-6">
          <div className="inline-flex max-w-full items-center rounded-full border border-[#FFBE00]/30 bg-[#FFBE00]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#FFBE00]">
            <span className="truncate">⚡ XTREME SPEED ACQUISITION SYSTEM</span>
          </div>

          <h1 className="break-words text-4xl font-extrabold uppercase leading-tight tracking-tight text-black sm:text-5xl md:text-6xl">
            SCRAPE <span className="text-[#FFBE00]">XTREME</span><br />
            LEADS IN<br />REAL-TIME
          </h1>

          <p className="max-w-md text-base font-medium leading-relaxed text-gray-500">
            The ultimate commercial intelligence engine for high-value contractors. Instantly pinpoint, verify, and dominate your territory with automated multi-source extraction.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <Link href="/auth" className="max-w-full">
              <button className="max-w-full rounded-lg bg-[#FFBE00] px-6 py-4 text-sm font-extrabold uppercase tracking-widest text-black shadow-md transition-all hover:bg-amber-500 sm:px-8">
                LAUNCH SCRAPER FREE
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 sm:flex sm:items-center sm:gap-8">
            <div className="min-w-0">
              <p className="text-xl font-black text-black sm:text-2xl">8,742</p>
              <p className="break-words text-[9px] font-black uppercase tracking-wider text-gray-400 sm:text-[10px] sm:tracking-widest">Leads Scraped</p>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-black sm:text-2xl">10+</p>
              <p className="break-words text-[9px] font-black uppercase tracking-wider text-gray-400 sm:text-[10px] sm:tracking-widest">Sources</p>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-black text-black sm:text-2xl">24ms</p>
              <p className="break-words text-[9px] font-black uppercase tracking-wider text-gray-400 sm:text-[10px] sm:tracking-widest">Avg Speed</p>
            </div>
          </div>
        </div>

        <div className="w-full min-w-0 max-w-md flex-1 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-xl">
          <div className="flex items-center justify-between gap-3 bg-black px-5 py-3">
            <div className="flex shrink-0 items-center space-x-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <span className="truncate text-[9px] font-black uppercase tracking-widest text-gray-500">LIVE EXTRACTION SCREEN</span>
          </div>
          <div className="space-y-3 p-4">
            {mockLeads.slice(0, 3).map((lead) => (
              <div key={lead.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-xs font-black uppercase text-black">{lead.name}</p>
                  <p className="mt-0.5 truncate text-[10px] font-bold text-gray-400">{lead.location} · {lead.phone}</p>
                </div>
                <span className="shrink-0 rounded border border-[#FFBE00]/20 bg-[#FFBE00]/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#FFBE00]">{lead.source}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:px-16">
        <div className="mb-8 flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h2 className="text-xl font-black uppercase tracking-tight text-black">LIVE SCRAPE RESULTS</h2>
            <span className="rounded-full border border-[#FFBE00]/20 bg-[#FFBE00]/10 px-3 py-1 text-[10px] font-black text-[#FFBE00]">
              {filteredLeads.length} FOUND
            </span>
          </div>
          <Link href="/auth">
            <button className="text-left text-xs font-black uppercase tracking-widest text-[#FFBE00] hover:underline">
              VIEW ALL →
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </section>

      <footer className="mt-auto bg-black px-4 py-10 text-white sm:px-6 md:px-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69db047707a15d69135e3de9/d515e2792_ChatGPTImageJul14202610_12_57PM2.png"
              style={{ height: '32px', mixBlendMode: 'multiply' as const, filter: 'invert(1)' }}
              className="shrink-0 object-contain"
              alt="XS"
            />
            <span className="truncate text-xs font-black uppercase tracking-widest text-gray-500">© 2026 Xtreme Scraper</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] font-black uppercase tracking-widest text-gray-600">
            <Link href="/auth" className="transition-colors hover:text-[#FFBE00]">Sign In</Link>
            <Link href="/memory" className="transition-colors hover:text-[#FFBE00]">Saved</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
