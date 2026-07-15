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
  const [stateFilter, setStateFilter] = React.useState('AZ');
  const [cityFilter, setCityFilter] = React.useState('Phoenix');
  const [showFilters, setShowFilters] = React.useState(false);
  const [toast, setToast] = React.useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleToggleSave = (id: string) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(item => item !== id));
      showToast('✗ Removed from Memory');
    } else {
      setSavedIds([...savedIds, id]);
      showToast('✓ Saved to Memory');
    }
  };

  const handleSearchClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "xtreme_scraper_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('✓ Exported as JSON');
  };

  return (
    <div className="flex bg-white min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-black text-[#FFBE00] font-black text-xs tracking-widest uppercase px-6 py-3 rounded shadow-2xl border border-[#FFBE00]/30 animate-pulse">
          {toast}
        </div>
      )}
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
            <div className="absolute inset-0 bg-[radial-gradient(#FFBE00_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
            
            <form onSubmit={handleSearchClick} className="relative z-10 flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[#FFBE00] text-sm">⚡</span>
                  <h2 className="text-lg font-black tracking-wider uppercase">START YOUR SEARCH</h2>
                </div>
                <button type="button" onClick={() => setShowFilters(f => !f)} className="text-xs font-black text-[#FFBE00] hover:underline uppercase tracking-widest">
                  Advanced Filters
                </button>
              </div>

              {/* Form Input Row */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Search Query</label>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Phoenix Flooring"
                    className="bg-transparent text-white font-extrabold text-xs focus:outline-none placeholder-zinc-700"
                  />
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Category</label>
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-white font-extrabold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="All" className="bg-zinc-950 text-white">All Categories</option>
                    <option value="Flooring Contractor" className="bg-zinc-950 text-white">Flooring Contractor</option>
                    <option value="Epoxy Coating Specialist" className="bg-zinc-950 text-white">Epoxy Specialist</option>
                    <option value="Concrete Polishing" className="bg-zinc-950 text-white">Concrete Polishing</option>
                  </select>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Source Node</label>
                  <select 
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="bg-transparent text-white font-extrabold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="All" className="bg-zinc-950 text-white">All Sources (G, Yelp, YP)</option>
                    <option value="Google" className="bg-zinc-950 text-white">Google Maps API</option>
                    <option value="Yelp" className="bg-zinc-950 text-white">Yelp Scraper</option>
                    <option value="YellowPages" className="bg-zinc-950 text-white">YellowPages API</option>
                  </select>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Target State</label>
                  <select 
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="bg-transparent text-white font-extrabold text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="AZ" className="bg-zinc-950 text-white">Arizona (AZ)</option>
                    <option value="CA" className="bg-zinc-950 text-white">California (CA)</option>
                    <option value="TX" className="bg-zinc-950 text-white">Texas (TX)</option>
                  </select>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Target City</label>
                  <input 
                    type="text" 
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    placeholder="e.g. Phoenix"
                    className="bg-transparent text-white font-extrabold text-xs focus:outline-none placeholder-zinc-700"
                  />
                </div>
              </div>

              {/* Run button */}
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-8 py-3.5 bg-[#FFBE00] hover:bg-amber-500 text-black font-black text-xs tracking-widest uppercase rounded shadow-lg transition-all">
                  RUN SCRAPE NODE
                </button>
              </div>
            </form>
          </section>

          {/* Table Controls Panel */}
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-black text-black uppercase tracking-tight">SCRAPE STREAM RESULTS</h3>
                <span className="bg-[#FFBE00]/15 text-[#FFBE00] text-[10px] font-black px-2.5 py-1 rounded border border-[#FFBE00]/20 uppercase">
                  {leads.length} Records
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleExportData} className="px-4 py-2 border border-gray-200 hover:border-black text-black font-black text-xs tracking-wider uppercase rounded transition-all bg-white flex items-center space-x-2">
                  <span>Export JSON</span>
                </button>
                <button onClick={() => { setLeads(mockLeads); showToast('✓ Leads refreshed'); }} className="px-4 py-2 border border-gray-200 hover:border-black text-black font-black text-xs tracking-wider uppercase rounded transition-all bg-white flex items-center space-x-2">
                  <span>Sync Nodes</span>
                </button>
                <button onClick={() => { const allIds = leads.map(l => l.id); setSavedIds(allIds); showToast(`✓ ${allIds.length} leads saved to Memory`); }} className="px-5 py-2.5 bg-[#FFBE00] hover:bg-amber-500 text-black font-black text-xs tracking-widest uppercase rounded shadow-md transition-all flex items-center space-x-2">
                  <Plus size={14} className="stroke-[3]" />
                  <span>Bulk Save</span>
                </button>
              </div>
            </div>

            {/* Lead Table Component */}
            <LeadTable leads={leads} onToggleSave={handleToggleSave} savedIds={savedIds} />
          </div>
        </div>
      </div>
    </div>
  );
}
