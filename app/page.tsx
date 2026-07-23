'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [currentPlaceholder, setCurrentPlaceholder] = useState('Plumbers in Dallas...');

  useEffect(() => {
    const placeholders = [
      'Plumbers in Dallas...',
      'Roofing contractors in Denver...',
      'Wedding photographers in Austin...',
      'Accountants in Chicago...',
      'Restaurants in Miami...'
    ];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % placeholders.length;
      setCurrentPlaceholder(placeholders[index]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const industries = [
    'Plumbing', 'Roofing', 'Flooring', 'Electrical', 'HVAC', 'Landscaping', 'Painting', 'Pest Control',
    'Photography', 'Accounting', 'Legal', 'Real Estate', 'Restaurants', 'Dental', 'Medical',
    'Auto Repair', 'Cleaning', 'Gyms', 'Salons', 'Construction', 'Transportation', 'Retail',
    'Event Planning', 'Catering', 'Insurance', 'Marketing', 'IT Services', 'Tutoring', 'Childcare', 'Pet Services'
  ];

  return (
    <main className="min-h-screen bg-[#ffffff] text-black font-sans flex flex-col selection:bg-[#FFBE00] selection:text-black">
      {/* NAVIGATION */}
      <header className="w-full bg-[#ffffff] border-b border-gray-100 py-6 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="font-black text-2xl tracking-tighter text-black uppercase">
            XTREME SCRAPER
          </div>
          <Link 
            href="/dashboard"
            className="text-[#FFBE00] hover:text-[#e6ab00] transition-colors font-black text-sm md:text-base uppercase tracking-wider flex items-center gap-1"
          >
            Go to Dashboard &rarr;
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-[#ffffff] text-black py-16 md:py-28 px-6 md:px-12 flex flex-col items-center text-center max-w-5xl mx-auto w-full">
        {/* Massive Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-[76px] font-black text-black leading-tight md:leading-none tracking-tighter uppercase max-w-5xl">
          Find Any Business.<br className="hidden md:inline" /> Any Industry. Any City.
        </h1>

        {/* Subheadline */}
        <p className="mt-8 text-lg md:text-xl text-gray-700 max-w-3xl mx-auto font-bold leading-relaxed">
          Type what you&apos;re looking for &mdash; plumbers, realtors, restaurants, contractors, photographers &mdash; and get a focused list of real businesses with phone numbers, ratings, and addresses. Instantly.
        </p>

        {/* Animated Visual Placeholder */}
        <div className="w-full max-w-2xl mx-auto mt-12 mb-8">
          <div className="relative flex items-center bg-[#ffffff] border-2 border-gray-200 rounded-none h-14 px-4 shadow-sm">
            <svg className="w-6 h-6 text-gray-400 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div className="text-gray-700 text-lg md:text-xl font-bold overflow-hidden whitespace-nowrap text-left flex items-center w-full">
              <span>{currentPlaceholder}</span>
              <span className="inline-block w-1.5 h-6 ml-1 bg-[#FFBE00] animate-pulse" />
            </div>
          </div>
        </div>

        {/* ONE CTA button */}
        <div className="mb-6">
          <Link href="/dashboard">
            <button 
              style={{ backgroundColor: '#FFBE00' }}
              className="text-black font-black text-lg md:text-xl px-10 py-5 rounded-none shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 uppercase tracking-wider"
            >
              Search Any Industry Now &rarr;
            </button>
          </Link>
        </div>

        {/* Trust Stats below button */}
        <p className="text-xs md:text-sm text-gray-500 font-black tracking-widest uppercase">
          100+ results per search &bull; Phone numbers included &bull; Any city in the US
        </p>
      </section>

      {/* INDUSTRY SHOWCASE */}
      <section className="bg-[#ffffff] py-16 px-6 md:px-12 border-t border-gray-100 w-full">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-black text-center mb-12 tracking-tighter uppercase">
            Works For Every Industry
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {industries.map((industry) => (
              <div 
                key={industry}
                className="px-4 py-2 rounded-full border border-gray-200 text-black font-bold text-xs md:text-sm hover:bg-[#FFBE00] transition-colors cursor-default"
              >
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#ffffff] py-20 px-6 md:px-12 border-t border-gray-100 w-full">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-black text-center mb-16 tracking-tighter uppercase">
            How It Works
          </h2>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Step 1 */}
            <div className="flex-1 bg-[#ffffff] border border-gray-200 rounded-none p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div 
                  style={{ backgroundColor: '#FFBE00' }}
                  className="w-12 h-12 flex items-center justify-center text-black font-black text-xl mb-6 rounded-none"
                >
                  1
                </div>
                <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                  Tell Us What You Need
                </h3>
                <p className="text-gray-600 font-bold leading-relaxed text-sm md:text-base">
                  Type any industry or business category. Be specific or broad &mdash; we handle both.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex-1 bg-[#ffffff] border border-gray-200 rounded-none p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div 
                  style={{ backgroundColor: '#FFBE00' }}
                  className="w-12 h-12 flex items-center justify-center text-black font-black text-xl mb-6 rounded-none"
                >
                  2
                </div>
                <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                  We Search Everything
                </h3>
                <p className="text-gray-600 font-bold leading-relaxed text-sm md:text-base">
                  Our engine scans Google Maps, BBB, Yellow Pages, and more simultaneously &mdash; filtered to your exact city and industry.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex-1 bg-[#ffffff] border border-gray-200 rounded-none p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div 
                  style={{ backgroundColor: '#FFBE00' }}
                  className="w-12 h-12 flex items-center justify-center text-black font-black text-xl mb-6 rounded-none"
                >
                  3
                </div>
                <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                  Get Phone-Ready Results
                </h3>
                <p className="text-gray-600 font-bold leading-relaxed text-sm md:text-base">
                  Every result includes business name, phone number, rating, and address. Export or call directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STATS BAR */}
      <section 
        style={{ backgroundColor: '#FFBE00' }}
        className="w-full py-16 px-6 md:px-12 text-black"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4 text-center">
          <div className="flex flex-col items-center flex-1 w-full">
            <span className="text-5xl md:text-6xl font-black tracking-tight">30+</span>
            <span className="text-sm font-black mt-2 tracking-widest uppercase">Industries</span>
          </div>
          <div className="flex flex-col items-center flex-1 w-full border-t md:border-t-0 md:border-l border-black/10 pt-8 md:pt-0">
            <span className="text-5xl md:text-6xl font-black tracking-tight">100+</span>
            <span className="text-sm font-black mt-2 tracking-widest uppercase">Results Per Search</span>
          </div>
          <div className="flex flex-col items-center flex-1 w-full border-t md:border-t-0 md:border-l border-black/10 pt-8 md:pt-0">
            <span className="text-5xl md:text-6xl font-black tracking-tight">56%</span>
            <span className="text-sm font-black mt-2 tracking-widest uppercase">Have Phone Numbers</span>
          </div>
          <div className="flex flex-col items-center flex-1 w-full border-t md:border-t-0 md:border-l border-black/10 pt-8 md:pt-0">
            <span className="text-5xl md:text-6xl font-black tracking-tight">Any US City</span>
            <span className="text-sm font-black mt-2 tracking-widest uppercase">Coverage</span>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR (3 personas) */}
      <section className="bg-[#ffffff] py-20 px-6 md:px-12 w-full">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-black text-center mb-16 tracking-tighter uppercase">
            Who It&apos;s For
          </h2>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Persona 1 */}
            <div className="flex-1 bg-[#ffffff] border border-gray-200 rounded-none p-8 hover:shadow-md transition-shadow">
              <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                Sales Teams &amp; Lead Gen
              </h3>
              <p className="text-gray-600 font-bold leading-relaxed text-sm md:text-base">
                Build targeted call lists for any territory in minutes. Filter by city, industry, rating.
              </p>
            </div>

            {/* Persona 2 */}
            <div className="flex-1 bg-[#ffffff] border border-gray-200 rounded-none p-8 hover:shadow-md transition-shadow">
              <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                Business Owners &amp; Operators
              </h3>
              <p className="text-gray-600 font-bold leading-relaxed text-sm md:text-base">
                Understand your competitive landscape. Find every competitor and partner in your market.
              </p>
            </div>

            {/* Persona 3 */}
            <div className="flex-1 bg-[#ffffff] border border-gray-200 rounded-none p-8 hover:shadow-md transition-shadow">
              <h3 className="text-xl md:text-2xl font-black text-black mb-4 uppercase tracking-tight">
                Researchers &amp; Analysts
              </h3>
              <p className="text-gray-600 font-bold leading-relaxed text-sm md:text-base">
                Gather structured business data for market research, reports, or database building.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA BAND */}
      <section className="bg-[#111111] text-white py-24 px-6 md:px-12 text-center w-full">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-4 text-white leading-tight">
            Your Next 100 Leads Are One Search Away
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-bold mb-10 max-w-2xl mx-auto uppercase tracking-wide">
            Any industry. Any city. Results in seconds.
          </p>
          <div className="flex justify-center">
            <Link href="/dashboard">
              <button 
                style={{ backgroundColor: '#FFBE00' }}
                className="text-black font-black text-lg md:text-xl px-10 py-5 rounded-none shadow-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 uppercase tracking-wider"
              >
                Start Searching Free &rarr;
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-8 text-center bg-[#ffffff] border-t border-gray-100 text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider">
        &copy; 2026 Strategic Minds Advisory. All rights reserved.
      </footer>
    </main>
  );
}
