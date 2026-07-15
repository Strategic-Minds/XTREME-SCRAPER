'use client';

import React from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import StatCard from '../../components/StatCard';
import LeadTable from '../../components/LeadTable';
import { mockLeads, mockStats } from '../../lib/mockData';
import { Search, Filter, SlidersHorizontal, ChevronRight, Plus } from 'lucide-react';

export default function Dashboard() {
  const [leads, setLeads] = React.useState(mockLeads);
  const [savedIds, setSavedIds] = React.useState<string[]>(['lead-1', 'lead-4']);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [sourceFilter, setSourceFilter] = React.useState('All');

  const handleToggleSave = (id: string) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(item => item !== id));
    } else {
      setSavedIds([...savedIds, id]);
    }
  };

  const handleSearchClick = () => {
    let result = mockLeads;
    if (searchQuery) {
      result = result.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.city.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (categoryFilter !== 'All') {
      result = result.filter(l => l.category === categoryFilter);
    }
    if (sourceFilter !== 'All') {
      result = result.filter(l => l.source === sourceFilter);
    }
    setLeads(result);
  };

  return (
    <div className="flex bg-white min-h-screen">
      {/* Black Left Sidebar */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <TopNav />

        {/* Content Area */}
        <div className="p-8 md:p-12 space-y-10 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col space-y-1 pb-6 border-b border-gray-100">
            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">OVERVIEW</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-black uppercase">
              DASHBOARD <span className="text-gray-300 font-normal">/</span> Find. Connect. Grow.
            </h1>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {mockStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          {/* Search Panel (Black Background) */}
          <section className="bg-black text-white rounded-2xl p-8 border border-zinc-900 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#F5A000_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
            
            <div className="relative z-10 flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[#F5A000] text-sm">⚡</span>
                  <h2 className="text-lg font-black tracking-wider uppercase">START YOUR SEARCH</h2>
                </div>
                <button className="text-xs font-black text-[#F5A000] hover:underline uppercase tracking-widest">
                  Advanced Filters
                </button>
              </div>

              {/* Form Input Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">LOCATION</label>
                  <select className="bg-transparent text-white font-extrabold text-sm focus:outline-none appearance-none cursor-pointer">
                    <option className="bg-black text-white">Phoenix, AZ</option>
                    <option className="bg-black text-white">Tempe, AZ</option>
                    <option className="bg-black text-white">Mesa, AZ</option>
                    <option className="bg-black text-white">Scottsdale, AZ</option>
                  </select>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">INDUSTRY</label>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-white font-extrabold text-sm focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="All" className="bg-black text-white">All Flooring Industries</option>
                    <option value="Flooring Contractor" className="bg-black text-white">Flooring Contractor</option>
                    <option value="Epoxy Coating Specialist" className="bg-black text-white">Epoxy Coating Specialist</option>
                    <option value="Concrete Polishing" className="bg-black text-white">Concrete Polishing</option>
                    <option value="Hardwood Specialist" className="bg-black text-white">Hardwood Specialist</option>
                  </select>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">SOURCES</label>
                  <select 
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="bg-transparent text-white font-extrabold text-sm focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="All" className="bg-black text-white">All Sources (Google/Yelp/YP)</option>
                    <option value="Google" className="bg-black text-white">Google Maps</option>
                    <option value="Yelp" className="bg-black text-white">Yelp</option>
                    <option value="YellowPages" className="bg-black text-white">Yellow Pages</option>
                  </select>
                </div>

                <button 
                  onClick={handleSearchClick}
                  className="bg-[#F5A000] hover:bg-amber-500 text-black font-black text-xs tracking-widest uppercase rounded-lg flex items-center justify-center space-x-2 transition-all shadow-lg"
                >
                  <Search size={16} className="stroke-[3]" />
                  <span>SEARCH</span>
                </button>
              </div>

              {/* Bottom Feature Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-900 text-xs text-gray-400 font-bold">
                <div className="flex items-center space-x-3">
                  <span className="text-[#F5A000] text-lg">⚡</span>
                  <div>
                    <span className="block font-black text-white uppercase text-[10px] tracking-wider">FAST RESULTS</span>
                    <span className="text-[11px] text-zinc-500">Scrapes executed in real-time.</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[#F5A000] text-lg">✓</span>
                  <div>
                    <span className="block font-black text-white uppercase text-[10px] tracking-wider">ACCURATE DATA</span>
                    <span className="text-[11px] text-zinc-500">Every single detail is cross-verified.</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[#F5A000] text-lg">🏆</span>
                  <div>
                    <span className="block font-black text-white uppercase text-[10px] tracking-wider">BUILT FOR PROS</span>
                    <span className="text-[11px] text-zinc-500">Designed for enterprise scaling.</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Table Leads Section */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-black text-black uppercase tracking-tight">LIVE RESULTS</h2>
                <span className="bg-[#F5A000]/15 text-[#F5A000] text-xs font-black px-3 py-1 rounded-full border border-[#F5A000]/20">
                  {leads.length} RESULTS FOUND
                </span>
              </div>

              {/* Table Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Filter by business name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#F5A000] w-48"
                />
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg text-xs font-black text-gray-500 hover:text-black uppercase tracking-wider transition-all bg-white">
                  <SlidersHorizontal size={12} />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Results Leads Table */}
            <LeadTable leads={leads} onToggleSave={handleToggleSave} savedIds={savedIds} />

            {/* Table Pagination */}
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Showing 1-{leads.length} of {leads.length} leads</span>
              <div className="flex items-center space-x-1.5">
                <button className="px-3 py-1.5 border border-gray-200 text-xs font-black rounded text-black bg-[#F5A000] border-[#F5A000]">1</button>
                <button className="px-3 py-1.5 border border-gray-200 text-xs font-black rounded text-gray-500 hover:text-black bg-white transition-colors">2</button>
                <button className="px-3 py-1.5 border border-gray-200 text-xs font-black rounded text-gray-500 hover:text-black bg-white transition-colors">3</button>
                <span className="text-gray-400 text-xs px-1">...</span>
                <button className="px-3 py-1.5 border border-gray-200 text-xs font-black rounded text-gray-500 hover:text-black bg-white transition-colors">16</button>
                <button className="p-2 border border-gray-200 rounded text-gray-500 hover:text-black bg-white transition-colors">
                  <ChevronRight size={14} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
