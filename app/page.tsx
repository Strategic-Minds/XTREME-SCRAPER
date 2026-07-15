'use client';

import React from 'react';
import Link from 'next/link';
import TopNav from '../components/TopNav';
import SearchBar from '../components/SearchBar';
import LeadCard from '../components/LeadCard';
import { mockLeads } from '../lib/mockData';

export default function Home() {
  const [filteredLeads, setFilteredLeads] = React.useState(mockLeads);

  const handleSearch = (industry: string, location: string, source: string) => {
    let result = mockLeads;
    if (source !== 'All Sources') {
      result = result.filter(l => l.source === source);
    }
    if (industry) {
      result = result.filter(l => l.category.toLowerCase().includes(industry.toLowerCase()) || l.tags.includes(industry.toLowerCase()));
    }
    setFilteredLeads(result);
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Top Nav Bar */}
      <TopNav />

      {/* Hero Section */}
      <section className="relative bg-black text-white py-24 px-6 md:px-12 flex flex-col items-center justify-center overflow-hidden border-b border-zinc-900">
        {/* Diagonal Stripe Accent */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute -left-1/4 -top-1/4 w-[150%] h-[150%] bg-gradient-to-br from-[#FFBE00] to-transparent transform -skew-y-12 origin-top-left" />
        </div>

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Hero text */}
          <div className="lg:col-span-7 flex flex-col space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 w-fit">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFBE00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFBE00]"></span>
              </span>
              <span className="text-[10px] font-black tracking-widest text-[#FFBE00] uppercase">XTREME SPEED ACQUISITION SYSTEM</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight leading-none">
              SCRAPE <span className="text-[#FFBE00]">XTREME</span> LEADS IN REAL-TIME
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-xl">
              The ultimate commercial intelligence engine for high-value contractors. Instantly pinpoint, verify, and dominate your territory with automated multi-source extraction.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/dashboard">
                <button className="bg-[#FFBE00] text-black font-black text-sm tracking-widest uppercase px-8 py-4 rounded-xl hover:brightness-110 hover:-translate-y-0.5 transition-all shadow-lg shadow-[#FFBE00]/20">
                  LAUNCH SCRAPER FREE
                </button>
              </Link>
              <Link href="/auth">
                <button className="bg-transparent text-white border border-zinc-800 font-black text-sm tracking-widest uppercase px-8 py-4 rounded-xl hover:bg-zinc-950 transition-all">
                  VIEW PRICING plans
                </button>
              </Link>
            </div>

            {/* Stats Ticker */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-zinc-900 mt-8">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-[#FFBE00]">8,742</span>
                <span className="text-[#888] font-bold text-[10px] uppercase tracking-widest mt-1">LEADS FOUND TODAY</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-white">10+</span>
                <span className="text-[#888] font-bold text-[10px] uppercase tracking-widest mt-1">SOURCES SCRAPED</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-white">24ms</span>
                <span className="text-[#888] font-bold text-[10px] uppercase tracking-widest mt-1">AVERAGE API LATENCY</span>
              </div>
            </div>
          </div>

          {/* Hero Mockup Card */}
          <div className="lg:col-span-5 relative w-full">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FFBE00] to-amber-500 opacity-30 blur-lg animate-pulse" />
            <div className="relative bg-[#111] border border-zinc-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">LIVE EXTRACTION SCREEN</span>
              </div>
              <div className="space-y-4">
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-black text-sm uppercase tracking-wide">PHOENIX EPOXY SPECIALISTS</span>
                    <span className="text-[#FFBE00] text-xs font-black px-2 py-0.5 bg-[#FFBE00]/10 border border-[#FFBE00]/20 rounded">GOOGLE MAPS</span>
                  </div>
                  <div className="text-zinc-500 text-xs font-bold mt-2">📍 Phoenix, AZ | 📞 (602) 555-0198</div>
                  <div className="flex items-center space-x-1 mt-2 text-yellow-500 text-xs">
                    <span>★★★★★</span>
                    <span className="text-white font-black ml-1">4.9</span>
                    <span className="text-zinc-500 font-bold ml-1">(142 reviews)</span>
                  </div>
                </div>
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-4 opacity-70">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-black text-sm uppercase tracking-wide">DESERT SUN FLOORING</span>
                    <span className="text-[#FFBE00] text-xs font-black px-2 py-0.5 bg-[#FFBE00]/10 border border-[#FFBE00]/20 rounded">YELP</span>
                  </div>
                  <div className="text-zinc-500 text-xs font-bold mt-2">📍 Tempe, AZ | 📞 (480) 555-0322</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Search and Results Area */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto w-full relative z-10">
        <div className="flex flex-col space-y-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
            TEST DRIVE THE ENGINE
          </h2>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-none">
            SELECT INDUSTRY & TARGET CITY FOR AN INSTANT EXTRACTION
          </p>
        </div>

        <div className="mb-12">
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="space-y-6">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
              <p className="text-zinc-500 font-bold">No leads match your search criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-[#111] py-20 px-6 border-t border-b border-zinc-900">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">UNCOMPROMISING SPEED. XTREME CAPABILITIES.</h2>
            <p className="text-zinc-400 font-medium">We connect directly to local directories, maps, review networks, and business registries to deliver raw, structured lead data instantly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black border border-zinc-900 rounded-2xl p-8 hover:border-[#FFBE00] transition-colors">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">DIRECT MULTI-CHANNEL extraction</h3>
              <p className="text-zinc-500 text-sm font-medium">Scrape Google Maps, Yelp, Yellow Pages, Angi, HomeAdvisor, and business directories in parallel with one click.</p>
            </div>
            <div className="bg-black border border-zinc-900 rounded-2xl p-8 hover:border-[#FFBE00] transition-colors">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">REAL-TIME VERIFICATION</h3>
              <p className="text-zinc-500 text-sm font-medium">Every phone number, website link, and licensing status is verified on-the-fly to ensure zero wasted outreach.</p>
            </div>
            <div className="bg-black border border-zinc-900 rounded-2xl p-8 hover:border-[#FFBE00] transition-colors">
              <div className="text-3xl mb-4">📂</div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">INSTANT FORMAT EXPORTS</h3>
              <p className="text-zinc-500 text-sm font-medium">Download beautifully structured CSV or JSON files designed for direct upload to your CRM of choice.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 md:px-12 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wider">PLAN OPTIONS BUILT FOR SCALE</h2>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest leading-none">CHOOSE YOUR INTENSITY LEVEL</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="bg-[#111] border border-zinc-800 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">STARTER</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">For single-operator local contractors</p>
              <div className="my-6 flex items-baseline">
                <span className="text-5xl font-black text-white">9</span>
                <span className="text-zinc-500 font-bold text-sm ml-2">/ month</span>
              </div>
              <ul className="space-y-3 border-t border-zinc-900 pt-6">
                <li className="text-zinc-400 text-sm font-bold">✓ 1,000 monthly lead exports</li>
                <li className="text-zinc-400 text-sm font-bold">✓ 3 scraper sources (G, Yelp, YP)</li>
                <li className="text-zinc-400 text-sm font-bold">✓ Basic export formats (CSV)</li>
              </ul>
            </div>
            <Link href="/auth">
              <button className="w-full bg-transparent border border-zinc-800 text-white font-black text-xs tracking-widest uppercase py-3 rounded-xl hover:bg-zinc-950 transition-all mt-8">
                CHOOSE STARTER
              </button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-[#111] border-2 border-[#FFBE00] rounded-2xl p-8 flex flex-col justify-between relative shadow-2xl shadow-[#FFBE00]/5">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FFBE00] text-black font-black text-[9px] tracking-widest uppercase px-4 py-1.5 rounded-full">
              MOST POPULAR CHOICE
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">PRO INTENSITY</h3>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mt-1">For expanding regional contracting teams</p>
              <div className="my-6 flex items-baseline">
                <span className="text-5xl font-black text-white">9</span>
                <span className="text-zinc-400 font-bold text-sm ml-2">/ month</span>
              </div>
              <ul className="space-y-3 border-t border-zinc-900 pt-6">
                <li className="text-zinc-300 text-sm font-bold">✓ Unlimited monthly searches</li>
                <li className="text-zinc-300 text-sm font-bold">✓ All 10 high-value premium sources</li>
                <li className="text-zinc-300 text-sm font-bold">✓ Full lead validation & verification</li>
                <li className="text-zinc-300 text-sm font-bold">✓ 10,000 monthly exports (CSV, JSON)</li>
              </ul>
            </div>
            <Link href="/auth">
              <button className="w-full bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase py-3 rounded-xl hover:brightness-110 transition-all mt-8">
                UPGRADE TO PRO NOW
              </button>
            </Link>
          </div>

          {/* Agency Plan */}
          <div className="bg-[#111] border border-zinc-800 rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider">AGENCY ULTRA</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">For multi-state agencies & aggregators</p>
              <div className="my-6 flex items-baseline">
                <span className="text-5xl font-black text-white">99</span>
                <span className="text-zinc-500 font-bold text-sm ml-2">/ month</span>
              </div>
              <ul className="space-y-3 border-t border-zinc-900 pt-6">
                <li className="text-zinc-400 text-sm font-bold">✓ Unlimited monthly exports</li>
                <li className="text-zinc-400 text-sm font-bold">✓ Direct Webhook & CRM API push</li>
                <li className="text-zinc-400 text-sm font-bold">✓ Dedicated proxies & custom schedules</li>
                <li className="text-zinc-400 text-sm font-bold">✓ Priority 24/7 hyper-support</li>
              </ul>
            </div>
            <Link href="/auth">
              <button className="w-full bg-transparent border border-zinc-800 text-white font-black text-xs tracking-widest uppercase py-3 rounded-xl hover:bg-zinc-950 transition-all mt-8">
                CHOOSE AGENCY
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-zinc-900 py-12 px-6 text-center">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <img 
              src="https://media.base44.com/images/public/69db047707a15d69135e3de9/d515e2792_ChatGPTImageJul14202610_12_57PM2.png" 
              style={{ height: '32px', mixBlendMode: 'multiply' }} 
              className="object-contain" 
              alt="XTREME SCRAPER" 
            />
          </div>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
            © 2026 STRATEGIC MINDS. ALL RIGHTS RESERVED. POWERED BY XTREME SCRAPER.
          </p>
        </div>
      </footer>
    </main>
  );
}
