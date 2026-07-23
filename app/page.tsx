'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#ffffff] text-black font-sans flex flex-col selection:bg-[#FFBE00] selection:text-black">
      
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-screen flex flex-col justify-between bg-[#ffffff] text-black w-full overflow-hidden">
        {/* Top Navbar */}
        <header className="w-full flex items-center justify-between py-6 px-6 md:px-12 max-w-7xl mx-auto z-10">
          <div className="font-black text-2xl tracking-tighter text-black uppercase">
            XTREME SCRAPER
          </div>
          <Link 
            href="/dashboard" 
            className="text-[#FFBE00] hover:text-[#e6ab00] font-black text-sm md:text-base flex items-center gap-1 transition-colors uppercase tracking-wider"
          >
            Go to Dashboard &rarr;
          </Link>
        </header>

        {/* Hero Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-12 text-center max-w-5xl mx-auto py-12 z-10">
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black text-black tracking-tighter leading-none uppercase">
            Find 100+ Contractor Leads <br className="hidden md:inline" />in Under 60 Seconds
          </h1>
          
          <p className="mt-8 text-base md:text-xl text-gray-700 max-w-3xl mx-auto font-medium leading-relaxed">
            Xtreme Scraper automatically pulls verified business names, phone numbers, and ratings from Google Maps, BBB, and more — filtered to exactly your industry and city. No subscriptions. No data brokers.
          </p>

          <div className="mt-10">
            <Link href="/dashboard">
              <button className="bg-[#FFBE00] hover:bg-[#e6ab00] text-black font-extrabold px-8 py-5 rounded-none text-lg md:text-xl uppercase tracking-wider transition-all duration-200 transform hover:scale-[1.02] shadow-md flex items-center gap-2">
                Start Scraping Now &rarr;
              </button>
            </Link>
          </div>

          <p className="mt-6 text-xs md:text-sm text-gray-500 font-bold tracking-widest uppercase">
            107 leads found last run &bull; 16 keywords &bull; 4 active sources
          </p>
        </div>

        {/* Bottom decorative spacer to balance viewport height */}
        <div className="h-12 md:h-20"></div>
      </section>

      {/* SECTION 2 — HOW IT WORKS */}
      <section className="bg-[#ffffff] py-24 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-black text-center mb-16 tracking-tighter uppercase">
            How It Works
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Step 1 */}
            <div className="flex-1 bg-white border border-[#e5e7eb] rounded-none p-8 shadow-sm flex flex-col justify-between relative hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFBE00] text-black font-black text-base mb-6">
                  1
                </div>
                <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                  1. Pick Your Target
                </h3>
                <p className="text-gray-600 font-medium leading-relaxed text-sm md:text-base">
                  Choose your industry (Epoxy Flooring, Concrete Polishing, etc.) and city. Takes 10 seconds.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex-1 bg-white border border-[#e5e7eb] rounded-none p-8 shadow-sm flex flex-col justify-between relative hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFBE00] text-black font-black text-base mb-6">
                  2
                </div>
                <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                  2. We Scan Everything
                </h3>
                <p className="text-gray-600 font-medium leading-relaxed text-sm md:text-base">
                  Our engine hits Google Maps, BBB, Yellow Pages, and more simultaneously. 107 unique leads per run, deduplicated.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex-1 bg-white border border-[#e5e7eb] rounded-none p-8 shadow-sm flex flex-col justify-between relative hover:shadow-md transition-all duration-300">
              <div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#FFBE00] text-black font-black text-base mb-6">
                  3
                </div>
                <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                  3. Get Phone-Ready Leads
                </h3>
                <p className="text-gray-600 font-medium leading-relaxed text-sm md:text-base">
                  Leads come back with company name, phone, rating, and source. Ready to call or export.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — STATS BAR */}
      <section className="bg-[#FFBE00] py-16 px-6 md:px-12 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4 text-center text-black">
          <div className="flex flex-col items-center flex-1">
            <span className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">16 Keywords</span>
            <span className="text-black text-xs md:text-sm font-black mt-2 uppercase tracking-widest">Searched simultaneously</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">107 Leads</span>
            <span className="text-black text-xs md:text-sm font-black mt-2 uppercase tracking-widest">Per Phoenix, AZ run</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">56%</span>
            <span className="text-black text-xs md:text-sm font-black mt-2 uppercase tracking-widest">Have verified phone numbers</span>
          </div>
          <div className="flex flex-col items-center flex-1">
            <span className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">4s</span>
            <span className="text-black text-xs md:text-sm font-black mt-2 uppercase tracking-widest">Average run time (deep mode)</span>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHO IT'S FOR */}
      <section className="bg-[#ffffff] py-24 px-6 md:px-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-black text-center mb-16 tracking-tighter uppercase">
            Built For
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Persona 1 */}
            <div className="flex-1 bg-white border border-[#e5e7eb] rounded-none p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                Epoxy & Flooring Contractors
              </h3>
              <p className="text-gray-600 font-medium leading-relaxed text-sm md:text-base">
                Find competitors and referral partners in any city. Know who's active before you expand.
              </p>
            </div>

            {/* Persona 2 */}
            <div className="flex-1 bg-white border border-[#e5e7eb] rounded-none p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                Sales Teams & Canvassers
              </h3>
              <p className="text-gray-600 font-medium leading-relaxed text-sm md:text-base">
                Generate fresh call lists every morning. Never run out of prospects in your territory.
              </p>
            </div>

            {/* Persona 3 */}
            <div className="flex-1 bg-white border border-[#e5e7eb] rounded-none p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                Business Owners & Operators
              </h3>
              <p className="text-gray-600 font-medium leading-relaxed text-sm md:text-base">
                Understand your market. See who's operating in your area, their ratings, and phone numbers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FINAL CTA */}
      <section className="bg-[#111111] py-24 px-6 md:px-12 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none text-white">
            Your Next 100 Leads Are Waiting
          </h2>
          <p className="mt-6 text-gray-400 text-base md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Run your first search free. No account required.
          </p>
          <div className="mt-10">
            <Link href="/dashboard">
              <button className="bg-[#FFBE00] hover:bg-[#e6ab00] text-black font-extrabold px-8 py-5 rounded-none text-lg md:text-xl uppercase tracking-wider transition-all duration-200 transform hover:scale-[1.02] shadow-md flex items-center gap-2 mx-auto">
                Open the Scraper &rarr;
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white py-12 px-6 md:px-12 border-t border-gray-100 text-center">
        <p className="text-gray-500 font-bold text-sm uppercase tracking-wider">
          &copy; 2026 Strategic Minds Advisory. All rights reserved.
        </p>
      </footer>

    </main>
  );
}
