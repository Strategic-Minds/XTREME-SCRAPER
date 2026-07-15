'use client';
import React from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';

const SOURCES = [
  { name: 'Yellow Pages', icon: '📒', status: 'Active', leads: 4200, desc: 'National business directory with millions of contractor listings.' },
  { name: 'Google Maps', icon: '🗺️', status: 'Active', leads: 8100, desc: 'Real-time local business discovery via Google Places API.' },
  { name: 'Yelp', icon: '⭐', status: 'Active', leads: 3600, desc: 'Review-rich business profiles for quality signal scoring.' },
  { name: 'Angi', icon: '🔧', status: 'Active', leads: 1800, desc: 'HomeAdvisor-verified contractor leads with project history.' },
  { name: 'HomeAdvisor', icon: '🏠', status: 'Active', leads: 2200, desc: 'Pre-screened home service contractor marketplace.' },
  { name: 'BBB', icon: '🛡️', status: 'Active', leads: 990, desc: 'Better Business Bureau accredited businesses — high trust.' },
  { name: 'Thumbtack', icon: '📌', status: 'Active', leads: 1400, desc: 'On-demand service professional platform.' },
  { name: 'Houzz', icon: '🏡', status: 'Active', leads: 760, desc: 'Design & remodeling contractor discovery.' },
  { name: 'Bark.com', icon: '🐕', status: 'Coming Soon', leads: 0, desc: 'UK-based global contractor marketplace. Integration pending.' },
  { name: 'TaskRabbit', icon: '🐇', status: 'Coming Soon', leads: 0, desc: 'Freelance task marketplace for local contractors.' },
];

export default function SourcesPage() {
  return (
    <div className="flex bg-white min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <div className="p-12 max-w-6xl mx-auto w-full space-y-10">
          <div className="pb-6 border-b border-gray-100">
            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">CONFIGURATION</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-black uppercase mt-1">DATA SOURCES</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SOURCES.map(s => (
              <div key={s.name} className={`border rounded-2xl p-6 space-y-2 transition-all ${s.status === 'Active' ? 'border-[#FFBE00]/40 hover:border-[#FFBE00]' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="font-black uppercase text-sm">{s.name}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest ${s.status === 'Active' ? 'bg-[#FFBE00]/15 text-[#FFBE00] border border-[#FFBE00]/30' : 'bg-gray-100 text-gray-400'}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
                {s.leads > 0 && <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{s.leads.toLocaleString()} leads indexed</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
