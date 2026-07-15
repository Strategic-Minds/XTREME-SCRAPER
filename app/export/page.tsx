'use client';
import React from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { mockLeads } from '../../lib/mockData';
import Link from 'next/link';

export default function ExportPage() {
  const [exported, setExported] = React.useState(false);

  const handleExportCSV = () => {
    const headers = ['Name','Category','City','State','Phone','Email','Source','Rating'];
    const rows = mockLeads.map(l => [l.name, l.category, l.city, l.state, l.phone, l.email, l.source, l.rating].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'xtreme_leads.csv'; a.click();
    setExported(true); setTimeout(() => setExported(false), 2500);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(mockLeads, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'xtreme_leads.json'; a.click();
    setExported(true); setTimeout(() => setExported(false), 2500);
  };

  return (
    <div className="flex bg-white min-h-screen">
      {exported && <div className="fixed top-6 right-6 z-50 bg-black text-[#FFBE00] font-black text-xs tracking-widest uppercase px-6 py-3 rounded shadow-2xl">✓ FILE DOWNLOADED</div>}
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <div className="p-12 max-w-4xl mx-auto w-full space-y-10">
          <div className="pb-6 border-b border-gray-100">
            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">DATA</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-black uppercase mt-1">EXPORT CENTER</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-2xl p-8 space-y-4 hover:border-[#FFBE00] transition-all">
              <img src="https://media.base44.com/images/public/69db047707a15d69135e3de9/92df37ad9_ChatGPTImageJul14202610_12_57PM8.png" className="w-16 h-16 object-contain" alt="Export" />
              <h2 className="font-black text-xl uppercase">Export CSV</h2>
              <p className="text-gray-500 text-sm">Download all leads as a clean spreadsheet — perfect for importing into any CRM.</p>
              <button onClick={handleExportCSV} className="bg-[#FFBE00] hover:bg-amber-500 text-black font-black text-xs tracking-widest uppercase px-8 py-3 rounded shadow transition-all w-full">
                DOWNLOAD CSV
              </button>
            </div>
            <div className="border border-gray-100 rounded-2xl p-8 space-y-4 hover:border-[#FFBE00] transition-all">
              <img src="https://media.base44.com/images/public/69db047707a15d69135e3de9/92df37ad9_ChatGPTImageJul14202610_12_57PM8.png" className="w-16 h-16 object-contain" alt="Export" />
              <h2 className="font-black text-xl uppercase">Export JSON</h2>
              <p className="text-gray-500 text-sm">Full structured data export for developers and API integrations.</p>
              <button onClick={handleExportJSON} className="bg-black hover:bg-zinc-800 text-[#FFBE00] font-black text-xs tracking-widest uppercase px-8 py-3 rounded shadow transition-all w-full">
                DOWNLOAD JSON
              </button>
            </div>
          </div>
          <div className="bg-black rounded-2xl p-8 text-white space-y-3">
            <h3 className="font-black uppercase text-[#FFBE00]">📊 Export Summary</h3>
            <p className="text-sm text-gray-400">{mockLeads.length} leads ready for export · Last synced: just now</p>
            <Link href="/dashboard" className="inline-block mt-2 text-xs font-black text-[#FFBE00] hover:underline uppercase tracking-widest">← Back to Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
