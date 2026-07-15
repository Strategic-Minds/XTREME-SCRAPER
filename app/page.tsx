'use client';

import React from 'react';
import Link from 'next/link';
import TopNav from '../components/TopNav';
import LeadCard from '../components/LeadCard';
import { mockLeads } from '../lib/mockData';

export default function Home() {
  const [filteredLeads, setFilteredLeads] = React.useState(mockLeads.slice(0, 6));

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      <TopNav />

      {/* Hero — white background, clean */}
      <section className="bg-white py-20 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-12">
        {/* Left */}
        <div className="flex-1 space-y-6 max-w-xl">
          <div className="inline-flex items-center space-x-2 bg-[#FFBE00]/10 border border-[#FFBE00]/30 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-[#FFBE00] uppercase">
            <span>⚡ XTREME SPEED ACQUISITION SYSTEM</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-black uppercase">
            SCRAPE <span className="text-[#FFBE00]">XTREME</span><br />
            LEADS IN<br />REAL-TIME
          </h1>

          <p className="text-gray-500 font-medium text-base leading-relaxed max-w-md">
            The ultimate commercial intelligence engine for high-value contractors. Instantly pinpoint, verify, and dominate your territory with automated multi-source extraction.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <Link href="/auth">
              <button className="px-8 py-4 bg-[#FFBE00] text-black font-extrabold text-sm tracking-widest uppercase rounded-lg shadow-md hover:bg-amber-500 transition-all">
                LAUNCH SCRAPER FREE
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 pt-4 border-t border-gray-100">
            <div>
              <p className="text-2xl font-black text-black">8,742</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Leads Scraped</p>
            </div>
            <div>
              <p className="text-2xl font-black text-black">10+</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sources</p>
            </div>
            <div>
              <p className="text-2xl font-black text-black">24ms</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Speed</p>
            </div>
          </div>
        </div>

        {/* Right — mock preview card */}
        <div className="flex-1 max-w-md w-full bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-black px-5 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">LIVE EXTRACTION SCREEN</span>
          </div>
          <div className="p-4 space-y-3">
            {mockLeads.slice(0, 3).map((lead) => (
              <div key={lead.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-black text-black uppercase">{lead.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">{lead.location} · {lead.phone}</p>
                </div>
                <span className="text-[9px] font-black bg-[#FFBE00]/10 text-[#FFBE00] px-2 py-1 rounded border border-[#FFBE00]/20 uppercase tracking-wide">{lead.source}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-6 md:px-16 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black tracking-tight text-black uppercase">LIVE SCRAPE RESULTS</h2>
            <span className="bg-[#FFBE00]/10 text-[#FFBE00] text-[10px] font-black px-3 py-1 rounded-full border border-[#FFBE00]/20">
              {filteredLeads.length} FOUND
            </span>
          </div>
          <Link href="/auth">
            <button className="text-xs font-black text-[#FFBE00] hover:underline uppercase tracking-widest">
              VIEW ALL →
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-10 px-6 md:px-16 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://media.base44.com/images/public/69db047707a15d69135e3de9/d515e2792_ChatGPTImageJul14202610_12_57PM2.png"
              style={{ height: '32px', mixBlendMode: 'multiply' as const, filter: 'invert(1)' }}
              className="object-contain"
              alt="XS"
            />
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">© 2026 Xtreme Scraper</span>
          </div>
          <div className="flex items-center space-x-6 text-[10px] font-black text-gray-600 uppercase tracking-widest">
            <Link href="/auth" className="hover:text-[#FFBE00] transition-colors">Sign In</Link>
            <Link href="/memory" className="hover:text-[#FFBE00] transition-colors">Saved</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
