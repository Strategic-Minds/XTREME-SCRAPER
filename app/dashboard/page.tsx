'use client';

import React from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import StatCard from '../../components/StatCard';
import { mockLeads, mockStats } from '../../lib/mockData';
import { Search, Filter, SlidersHorizontal, ChevronRight, Plus, Star } from 'lucide-react';
import Link from 'next/link';

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

  const showToast = (msg: string) => { 
    setToast(msg); 
    setTimeout(() => setToast(''), 2500); 
  };

  const handleToggleSave = (id: string) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(item => item !== id));
      showToast('REMOVED FROM SAVED LIST');
    } else {
      setSavedIds([...savedIds, id]);
      showToast('ADDED TO SAVED LIST');
    }
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || l.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesSource = sourceFilter === 'All' || l.source.toLowerCase() === sourceFilter.toLowerCase();
    const matchesState = !stateFilter || l.state.toLowerCase() === stateFilter.toLowerCase();
    const matchesCity = !cityFilter || l.city.toLowerCase() === cityFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesSource && matchesState && matchesCity;
  });

  return (
    <div className="flex bg-black min-h-screen text-white font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase px-6 py-3 rounded-lg shadow-[0_0_15px_rgba(255,190,0,0.4)] transition-all duration-300 transform translate-y-0">
          ✓ {toast}
        </div>
      )}
      
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <div className="p-8 max-w-7xl mx-auto w-full">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <span className="text-[#888] font-bold text-[10px] uppercase tracking-widest">DASHBOARD / ACTIVE SCRAPE</span>
              <h1 className="text-3xl font-black text-white uppercase tracking-wider mt-1">EXTRACTION CONTROL</h1>
            </div>
            <button 
              onClick={() => showToast('NEW SCRAPE SESSION STARTED')} 
              className="bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase px-6 py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center space-x-2"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>NEW SEARCH SCRAPE</span>
            </button>
          </div>

          {/* Stats Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#111] border border-zinc-900 rounded-xl p-5">
              <div className="text-[#888] font-bold text-[10px] uppercase tracking-widest">TOTAL SCRAPED LEADS</div>
              <div className="text-3xl font-black text-white mt-1">25,842</div>
            </div>
            <div className="bg-[#111] border border-zinc-900 rounded-xl p-5">
              <div className="text-[#888] font-bold text-[10px] uppercase tracking-widest">SUCCESS RATE</div>
              <div className="text-3xl font-black text-emerald-500 mt-1">99.8%</div>
            </div>
            <div className="bg-[#111] border border-zinc-900 rounded-xl p-5">
              <div className="text-[#888] font-bold text-[10px] uppercase tracking-widest">ACTIVE PROXIES</div>
              <div className="text-3xl font-black text-[#FFBE00] mt-1">148 / 150</div>
            </div>
            <div className="bg-[#111] border border-zinc-900 rounded-xl p-5">
              <div className="text-[#888] font-bold text-[10px] uppercase tracking-widest">API CREDITS USED</div>
              <div className="text-3xl font-black text-zinc-300 mt-1">4,120 / 10k</div>
            </div>
          </div>

          {/* Search Card Section */}
          <div className="bg-[#111] border border-zinc-800 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 relative w-full">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter active workspace leads by name, keyword or category..." 
                  className="w-full bg-black border border-zinc-900 text-white pl-11 pr-4 py-3.5 rounded-xl font-bold text-sm focus:outline-none focus:border-[#FFBE00] transition-colors"
                />
              </div>
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className="bg-transparent border border-zinc-800 text-white font-black text-xs tracking-widest uppercase px-5 py-3.5 rounded-xl hover:bg-zinc-950 transition-all flex items-center space-x-2 w-full md:w-auto justify-center"
                >
                  <SlidersHorizontal size={14} />
                  <span>FILTERS</span>
                </button>
                <button 
                  onClick={() => showToast('ACTIVE FILTERS RESET')} 
                  className="bg-zinc-950 text-[#888] hover:text-white font-black text-xs tracking-widest uppercase px-5 py-3.5 rounded-xl transition-all w-full md:w-auto text-center border border-zinc-900"
                >
                  RESET
                </button>
              </div>
            </div>

            {/* Extra Dropdown Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-900">
                <div>
                  <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">CATEGORY</label>
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full bg-black border border-zinc-900 text-white font-extrabold text-xs tracking-widest uppercase px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#FFBE00] cursor-pointer"
                  >
                    <option value="All">ALL CATEGORIES</option>
                    <option value="Epoxy Coating Specialist">EPOXY COATING</option>
                    <option value="Flooring Contractor">FLOORING</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">SOURCE PLATFORM</label>
                  <select 
                    value={sourceFilter} 
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full bg-black border border-zinc-900 text-white font-extrabold text-xs tracking-widest uppercase px-4 py-3.5 rounded-xl focus:outline-none focus:border-[#FFBE00] cursor-pointer"
                  >
                    <option value="All">ALL PLATFORMS</option>
                    <option value="Google">GOOGLE MAPS</option>
                    <option value="Yelp">YELP</option>
                    <option value="YellowPages">YELLOW PAGES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">TARGET CITY</label>
                  <input 
                    type="text" 
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full bg-black border border-zinc-900 text-white font-extrabold text-xs tracking-widest px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFBE00]"
                  />
                </div>
                <div>
                  <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">TARGET STATE</label>
                  <input 
                    type="text" 
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full bg-black border border-zinc-900 text-white font-extrabold text-xs tracking-widest px-4 py-3 rounded-xl focus:outline-none focus:border-[#FFBE00]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Premium Table Area */}
          <div className="bg-[#111] border border-zinc-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-zinc-900 flex justify-between items-center">
              <div>
                <span className="text-white font-black text-sm uppercase tracking-wider">RESULTS SYSTEM WORKSPACE</span>
                <span className="text-[#888] font-bold text-xs ml-3">({filteredLeads.length} leads matching filter)</span>
              </div>
              <button 
                onClick={() => showToast('BULK SELECTION DELETED')} 
                className="text-red-500 hover:text-red-400 font-black text-[10px] uppercase tracking-widest"
              >
                DELETE SELECTED
              </button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950">
                    <th className="p-4 w-12 text-center">
                      <input type="checkbox" className="rounded bg-black border-zinc-850 text-[#FFBE00] focus:ring-[#FFBE00]" />
                    </th>
                    <th className="p-4 w-10"></th>
                    <th className="p-4 font-black text-[#888] uppercase tracking-widest text-[10px]">BUSINESS NAME</th>
                    <th className="p-4 font-black text-[#888] uppercase tracking-widest text-[10px]">CATEGORY</th>
                    <th className="p-4 font-black text-[#888] uppercase tracking-widest text-[10px]">LOCATION</th>
                    <th className="p-4 font-black text-[#888] uppercase tracking-widest text-[10px]">PHONE</th>
                    <th className="p-4 font-black text-[#888] uppercase tracking-widest text-[10px]">SOURCE</th>
                    <th className="p-4 font-black text-[#888] uppercase tracking-widest text-[10px] text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredLeads.map((lead, idx) => {
                    const isSaved = savedIds.includes(lead.id);
                    return (
                      <tr 
                        key={lead.id} 
                        className={'transition-all hover:bg-zinc-950/80 group border-l-2 border-l-transparent hover:border-l-[#FFBE00] ' + (idx % 2 === 0 ? 'bg-[#111]' : 'bg-[#141414]')}
                      >
                        <td className="p-4 text-center">
                          <input type="checkbox" className="rounded bg-black border-zinc-800 text-[#FFBE00] focus:ring-[#FFBE00]" />
                        </td>
                        <td className="p-4">
                          <button onClick={() => handleToggleSave(lead.id)} className="focus:outline-none">
                            <Star 
                              size={18} 
                              className={'transition-colors ' + (isSaved ? 'fill-[#FFBE00] text-[#FFBE00]' : 'text-zinc-700 hover:text-[#FFBE00]')} 
                            />
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded bg-black text-white flex items-center justify-center font-black text-xs tracking-wider border border-zinc-800 shrink-0">
                              {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-black text-white group-hover:text-[#FFBE00] transition-colors uppercase tracking-wide">
                                  {lead.name}
                                </span>
                                {lead.isVerified && (
                                  <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[9px] font-black">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1.5 mt-1">
                                {lead.tags.slice(0, 2).map((t) => (
                                  <span key={t} className="px-1.5 py-0.5 bg-black border border-zinc-800 text-[#888] rounded text-[8px] font-black tracking-widest uppercase">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-zinc-300 font-bold text-xs uppercase">{lead.category}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-zinc-300 font-bold text-xs uppercase">{lead.city}, {lead.state}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-zinc-300 font-bold text-xs uppercase">{lead.phone}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-black text-[#FFBE00] uppercase tracking-widest px-2.5 py-1 bg-[#FFBE00]/5 border border-[#FFBE00]/10 rounded">
                            {lead.source}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={'/lead/' + lead.id}>
                              <button className="px-3 py-1.5 bg-transparent hover:bg-zinc-800 text-white text-[10px] font-black tracking-widest uppercase rounded border border-zinc-800 transition-all">
                                VIEW
                              </button>
                            </Link>
                            <button 
                              onClick={() => showToast('EXCELLENT OUTREACH RECORD PREPARED')} 
                              className="px-3 py-1.5 bg-[#FFBE00] text-black text-[10px] font-black tracking-widest uppercase rounded hover:brightness-110 transition-all"
                            >
                              CONNECT
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
