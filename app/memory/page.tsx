'use client';

import React from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { mockLeads } from '../../lib/mockData';
import { Search, Star, MessageSquare, History, Bookmark, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Memory() {
  const [leads, setLeads] = React.useState(mockLeads);
  const [savedIds, setSavedIds] = React.useState<string[]>(['lead-1', 'lead-2', 'lead-4']);
  const [activeTab, setActiveTab] = React.useState('Saved Leads');
  const [toast, setToast] = React.useState('');
  const [newNote, setNewNote] = React.useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const tabs = ['Saved Leads', 'Saved Searches', 'Notes', 'History', 'Collections', 'Tags'];

  const handleToggleSave = (id: string) => {
    if (savedIds.includes(id)) {
      setSavedIds(savedIds.filter(item => item !== id));
      showToast('REMOVED FROM SAVED LIST');
    } else {
      setSavedIds([...savedIds, id]);
      showToast('ADDED TO SAVED LIST');
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    showToast('NEW SCRAPE INSIGHT NOTE SAVED');
    setNewNote('');
  };

  const savedLeadsList = leads.filter(l => savedIds.includes(l.id));

  return (
    <div className="flex bg-black min-h-screen text-white font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase px-6 py-3 rounded-lg shadow-2xl transition-all">
          ✓ {toast}
        </div>
      )}

      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <div className="p-8 max-w-7xl mx-auto w-full">

          {/* Header without giant watermark */}
          <div className="mb-8">
            <span className="text-[#888] font-bold text-[10px] uppercase tracking-widest">WORKSPACE / INSIGHT MEMORY</span>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider mt-1">SYSTEM MEMORY</h1>
          </div>

          {/* Pill Navigation Tab Buttons */}
          <div className="flex flex-wrap gap-2.5 bg-[#111] p-1.5 rounded-xl border border-zinc-900 w-fit mb-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    showToast('TAB SWITCHED TO ' + tab.toUpperCase());
                  }}
                  className={'px-5 py-2.5 rounded-lg text-xs font-black tracking-widest uppercase transition-all ' + (
                    isActive 
                      ? 'bg-[#FFBE00] text-black shadow-lg shadow-[#FFBE00]/10' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'Saved Leads' && (
            <div className="bg-[#111] border border-zinc-900 rounded-xl overflow-hidden shadow-2xl">
              <div className="px-6 py-5 border-b border-zinc-900">
                <span className="text-white font-black text-sm uppercase tracking-wider">SAVED CONTRACTORS</span>
                <span className="text-[#888] font-bold text-xs ml-3">({savedLeadsList.length} high-value leads)</span>
              </div>
              
              {savedLeadsList.length > 0 ? (
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-900 bg-zinc-950">
                        <th className="p-4 w-12 text-center">
                          <input type="checkbox" className="rounded bg-black border-zinc-800 text-[#FFBE00] focus:ring-[#FFBE00]" />
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
                      {savedLeadsList.map((lead, idx) => (
                        <tr 
                          key={lead.id}
                          className={'transition-all hover:bg-zinc-950/80 group border-l-2 border-l-transparent hover:border-l-[#FFBE00] ' + (idx % 2 === 0 ? 'bg-[#111]' : 'bg-[#141414]')}
                        >
                          <td className="p-4 text-center">
                            <input type="checkbox" className="rounded bg-black border-zinc-800 text-[#FFBE00]" />
                          </td>
                          <td className="p-4">
                            <button onClick={() => handleToggleSave(lead.id)} className="focus:outline-none">
                              <Star size={18} className="fill-[#FFBE00] text-[#FFBE00] hover:scale-110 transition-transform" />
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded bg-black border border-zinc-800 flex items-center justify-center font-black text-xs text-white shrink-0">
                                {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-black text-white group-hover:text-[#FFBE00] transition-colors uppercase tracking-wide">
                                  {lead.name}
                                </span>
                                <div className="flex items-center space-x-1.5 mt-1">
                                  {lead.tags.slice(0, 2).map(t => (
                                    <span key={t} className="px-1.5 py-0.5 bg-black border border-zinc-850 text-zinc-500 rounded text-[8px] font-black uppercase tracking-widest">
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
                                <button className="px-3 py-1.5 bg-transparent hover:bg-zinc-800 text-white text-[10px] font-black tracking-widest uppercase rounded border border-zinc-850 transition-all">
                                  VIEW
                                </button>
                              </Link>
                              <button 
                                onClick={() => handleToggleSave(lead.id)}
                                className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-red-500 text-[10px] font-black tracking-widest uppercase rounded border border-zinc-900 transition-all"
                              >
                                REMOVE
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 px-4">
                  <span className="text-4xl">📂</span>
                  <h3 className="text-lg font-black text-white uppercase tracking-wider mt-4">NO SAVED LEADS</h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-2">Bookmark records inside your dashboard search workspace to build your list.</p>
                </div>
              )}
            </div>
          )}

          {activeTab !== 'Saved Leads' && (
            <div className="bg-[#111] border border-zinc-900 rounded-xl p-8 text-center">
              <div className="text-3xl mb-4">⚙️</div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">{activeTab} STORAGE ENGINE</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-2">Premium storage features are active on the premium core plan.</p>
              
              {activeTab === 'Notes' && (
                <form onSubmit={handleAddNote} className="max-w-xl mx-auto mt-6 flex gap-3">
                  <input 
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add notes for saved lead accounts..."
                    className="flex-1 bg-black border border-zinc-850 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFBE00]"
                  />
                  <button type="submit" className="bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase px-6 rounded-xl hover:brightness-110 transition-all">
                    ADD
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
