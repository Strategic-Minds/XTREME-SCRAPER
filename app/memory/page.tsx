'use client';

import React from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import LeadTable from '../../components/LeadTable';
import { mockLeads, mockCollections, mockRecentActivities } from '../../lib/mockData';
import { Search, SlidersHorizontal, Plus, Mail, ShieldAlert, ArrowRight, Library, Layers, Sparkles } from 'lucide-react';

export default function Memory() {
  const [leads, setLeads] = React.useState(mockLeads);
  const [savedIds, setSavedIds] = React.useState<string[]>(['lead-1', 'lead-2', 'lead-4']);
  const [activeTab, setActiveTab] = React.useState('Saved Leads');

  const tabs = ['Saved Leads', 'Saved Searches', 'Notes', 'History', 'Collections', 'Tags'];

  const handleToggleSave = (id: string) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(item => item !== id));
      alert(`Removed lead from memory!`);
    } else {
      setSavedIds([...savedIds, id]);
      alert(`Saved lead to memory!`);
    }
  };

  const handleExportData = () => {
    const savedLeadsData = leads.filter(l => savedIds.includes(l.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedLeadsData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "xtreme_scraper_saved_leads.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    alert('Exported saved leads from memory as JSON!');
  };

  const handleClearMemory = () => {
    if (confirm("Are you sure you want to clear all memory profiles?")) {
      setSavedIds([]);
      alert("Memory lists successfully cleared.");
    }
  };

  // Only show the saved leads in the table
  const savedLeads = leads.filter(l => savedIds.includes(l.id));

  return (
    <div className="flex bg-white min-h-screen">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />

        {/* Inner Padding Container */}
        <div className="p-8 md:p-12 space-y-10 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col space-y-1.5 pb-6 border-b border-gray-100 relative">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none select-none">
              <span className="text-8xl font-black text-[#FFBE00]">XS</span>
            </div>
            <span className="text-[10px] font-black text-[#FFBE00] tracking-widest uppercase">Saved Intelligence</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-black uppercase flex items-center space-x-2">
              <span>MEMORY</span>
              <Sparkles className="text-[#FFBE00]" size={24} />
            </h1>
          </div>

          {/* Navigation Links back to Dashboard */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-xs font-black text-[#FFBE00] hover:underline uppercase tracking-widest flex items-center space-x-1">
              <span>← Back to Dashboard</span>
            </Link>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap gap-3">
            <div className="px-5 py-3 bg-zinc-950 text-white rounded-full flex items-center space-x-3 shadow-md border border-zinc-900">
              <span className="text-[#FFBE00] text-xs font-black">SAVED LEADS</span>
              <span className="font-extrabold text-sm border-l border-zinc-800 pl-3">{savedLeads.length}</span>
            </div>
            <div className="px-5 py-3 bg-zinc-950 text-white rounded-full flex items-center space-x-3 shadow-md border border-zinc-900">
              <span className="text-[#FFBE00] text-xs font-black">SAVED SEARCHES</span>
              <span className="font-extrabold text-sm border-l border-zinc-800 pl-3">124</span>
            </div>
            <div className="px-5 py-3 bg-zinc-950 text-white rounded-full flex items-center space-x-3 shadow-md border border-zinc-900">
              <span className="text-[#FFBE00] text-xs font-black">COLLECTIONS</span>
              <span className="font-extrabold text-sm border-l border-zinc-800 pl-3">28</span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab 
                    ? 'border-[#FFBE00] text-[#FFBE00]' 
                    : 'border-transparent text-gray-400 hover:text-black hover:border-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Table & Filtering: Colspan 3 */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Search saved list..." 
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#FFBE00] flex-1 min-w-[200px]"
                />
                
                <select className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-black text-gray-500 hover:text-black uppercase tracking-wider bg-white cursor-pointer focus:outline-none">
                  <option>All Collections</option>
                </select>
                <select className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-black text-gray-500 hover:text-black uppercase tracking-wider bg-white cursor-pointer focus:outline-none">
                  <option>All Tags</option>
                </select>
              </div>

              {/* Action Ribbon & Add Lead button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-black text-black uppercase tracking-tight">{savedLeads.length} saved leads</span>
                  <button onClick={handleExportData} className="text-xs font-black text-gray-400 hover:text-black transition-colors uppercase tracking-widest">Export JSON</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={handleClearMemory} className="text-xs font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest">Clear All</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => alert('Opening collections setup panel...')} className="text-xs font-black text-gray-400 hover:text-black transition-colors uppercase tracking-widest">Manage Collections</button>
                </div>

                <button onClick={() => alert('Starting automated scrape pipeline...')} className="flex items-center space-x-2 bg-[#FFBE00] hover:bg-amber-500 text-black font-black text-xs tracking-widest uppercase px-5 py-2.5 rounded shadow-md transition-colors">
                  <Plus size={14} className="stroke-[3]" />
                  <span>Add Lead</span>
                </button>
              </div>

              {/* Leads Table Component */}
              <LeadTable leads={savedLeads} onToggleSave={handleToggleSave} savedIds={savedIds} />
            </div>

            {/* Sidebar Columns: Recent Activities & Collections */}
            <div className="space-y-8">
              {/* Recent Activity */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Recent Activity</h3>
                <div className="space-y-4">
                  {mockRecentActivities.map((act, i) => (
                    <div key={i} className="flex flex-col space-y-0.5">
                      <span className="text-xs font-extrabold text-black leading-tight uppercase tracking-tight">{act.text}</span>
                      <span className="text-[11px] text-gray-500 font-medium truncate max-w-[220px]">{act.detail}</span>
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider pt-0.5">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Collections */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Top Collections</h3>
                  <button onClick={() => alert('Displaying all collections...')} className="text-[10px] font-black text-[#FFBE00] hover:underline uppercase tracking-wider">All</button>
                </div>
                <div className="space-y-3">
                  {mockCollections.map((col, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-bold">
                      <span onClick={() => alert(`Showing collection: ${col.name}`)} className="text-gray-700 hover:text-[#FFBE00] cursor-pointer transition-colors uppercase tracking-tight">{col.name}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-500 font-extrabold">{col.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
