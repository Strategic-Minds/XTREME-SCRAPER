'use client';

import React from 'react';
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
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Top Nav Bar */}
      <TopNav />

      {/* Hero Section */}
      <section className="bg-black text-white py-20 px-6 md:px-12 flex flex-col items-center text-center relative overflow-hidden">
        {/* Decorative Grid Line background */}
        <div className="absolute inset-0 bg-[radial-gradient(#F5A000_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
        
        <div className="max-w-4xl flex flex-col items-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-[#F5A000] uppercase shadow-lg">
            <span>⚡ NEXT-GENERATION LEAD INTEL</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-none text-white uppercase">
            FIND LOCAL BUSINESSES.<br />
            <span className="text-[#F5A000] italic font-black">FAST.</span>
          </h1>

          <p className="text-gray-400 font-bold text-base md:text-lg max-w-2xl leading-relaxed">
            The fastest, most accurate way to find, verify, and connect with local flooring, epoxy, and construction contractors.
          </p>

          {/* Large Pill Search Bar Container */}
          <div className="w-full max-w-3xl pt-4">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 pt-8 text-xs font-black text-gray-400 uppercase tracking-widest">
            <span className="flex items-center space-x-2">
              <span className="text-[#F5A000]">⚡</span> <span>FAST RESULTS</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="text-[#F5A000]">✓</span> <span>ACCURATE DATA</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="text-[#F5A000]">🏆</span> <span>BUILT FOR PROS</span>
            </span>
          </div>
        </div>
      </section>

      {/* Live Results Section */}
      <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black tracking-tight text-black uppercase">LIVE SCRAPE RESULTS</h2>
            <span className="bg-[#F5A000]/15 text-[#F5A000] text-xs font-black px-3 py-1 rounded-full border border-[#F5A000]/20">
              {filteredLeads.length} RESULTS FOUND
            </span>
          </div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2 md:mt-0">
            Real-time verified listings
          </span>
        </div>

        {/* Results List */}
        <div className="flex flex-col space-y-6">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <span className="text-3xl">🔍</span>
              <p className="mt-4 font-black text-gray-800 text-lg uppercase">No leads matched your search parameters.</p>
              <p className="text-gray-400 text-sm font-bold mt-1">Try selecting a different filter or checking your spelling.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer / Trust Section */}
      <footer className="bg-black text-white border-t border-zinc-900 py-16 px-6 md:px-12 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col items-center space-y-12">
          {/* Trust heading */}
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-[#F5A000] tracking-widest uppercase">TRUSTED INDUSTRY-WIDE</span>
            <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white uppercase">
              TRUSTED BY MARKETERS, AGENCIES & SALES PROS
            </h3>
            {/* Star ratings */}
            <div className="flex items-center justify-center space-x-2 pt-2">
              <span className="text-[#F5A000] text-lg">★★★★★</span>
              <span className="text-xs font-black text-gray-300">4.9/5 Rating (1,200+ Reviews)</span>
            </div>
          </div>

          {/* Features Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full border-t border-zinc-900 pt-12">
            <div className="flex flex-col space-y-2">
              <span className="text-[#F5A000] font-black text-base uppercase">No Coding Required</span>
              <p className="text-gray-500 font-bold text-xs leading-relaxed">
                Configure scrapes easily using drop-downs and semantic filters.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-[#F5A000] font-black text-base uppercase">Save Hours Every Day</span>
              <p className="text-gray-500 font-bold text-xs leading-relaxed">
                Automated sweeps find high-quality leads while you work.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-[#F5A000] font-black text-base uppercase">Export Clean Data Instantly</span>
              <p className="text-gray-500 font-bold text-xs leading-relaxed">
                Export directly to CSV, Excel, JSON or connect with Zapier.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="text-[#F5A000] font-black text-base uppercase">Your Data Stays Secure</span>
              <p className="text-gray-500 font-bold text-xs leading-relaxed">
                Compliance guaranteed. Secured with advanced SSL encryption.
              </p>
            </div>
          </div>

          {/* Copy */}
          <span className="text-xs font-black text-zinc-600 tracking-wider">
            © {new Date().getFullYear()} XTREME SCRAPER. ALL RIGHTS RESERVED.
          </span>
        </div>
      </footer>
    </main>
  );
}
