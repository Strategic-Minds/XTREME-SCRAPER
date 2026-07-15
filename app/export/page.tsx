'use client';
import React from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { mockLeads } from '../../lib/mockData';
import { FileDown, FileJson, Check, ArrowRight, RefreshCw, BarChart2 } from 'lucide-react';

export default function ExportPage() {
  const [exporting, setExported] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [toast, setToast] = React.useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleExport = (type: 'CSV' | 'JSON') => {
    if (exporting) return;
    setExported(type);
    setProgress(0);
    
    // Animate Progress states
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Actually download the file
            if (type === 'CSV') {
              const headers = ['Name','Category','City','State','Phone','Email','Source','Rating'];
              const rows = mockLeads.map(l => [l.name, l.category, l.city, l.state, l.phone, l.email, l.source, l.rating].join(','));
              const csv = [headers.join(','), ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'xtreme_leads.csv'; a.click();
            } else {
              const json = JSON.stringify(mockLeads, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'xtreme_leads.json'; a.click();
            }
            setExported(null);
            showToast('SUCCESSFULLY EXPORTED ' + mockLeads.length + ' RECORDS TO ' + type);
          }, 300);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

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
        <div className="p-8 max-w-5xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-10">
            <span className="text-[#888] font-bold text-[10px] uppercase tracking-widest">WORKSPACE / EXTRACTION EXPORT</span>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider mt-1">DATA EXPORT PORTAL</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Export options */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[#111] border border-zinc-900 rounded-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#FFBE00] transition-colors">
                <div className="flex items-start space-x-5">
                  <div className="w-14 h-14 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-emerald-500 shrink-0">
                    <FileDown size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wider">COMMA SEPARATED VALUES (.CSV)</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">Best for Microsoft Excel, Google Sheets, or direct import to CRM platforms.</p>
                    <div className="mt-3 text-[#FFBE00] text-[10px] font-black uppercase tracking-widest">
                      READY: {mockLeads.length} RECORDS PREPARED
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleExport('CSV')}
                  disabled={exporting !== null}
                  className="bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase px-6 py-4 rounded-xl hover:brightness-110 transition-all shrink-0 min-w-[150px] text-center disabled:opacity-50"
                >
                  {exporting === 'CSV' ? 'EXPORTING...' : 'EXPORT CSV'}
                </button>
              </div>

              <div className="bg-[#111] border border-zinc-900 rounded-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#FFBE00] transition-colors">
                <div className="flex items-start space-x-5">
                  <div className="w-14 h-14 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-amber-500 shrink-0">
                    <FileJson size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wider">JAVASCRIPT OBJECT NOTATION (.JSON)</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">Best for developers, webhooks, databases, or complex custom integrations.</p>
                    <div className="mt-3 text-[#FFBE00] text-[10px] font-black uppercase tracking-widest">
                      READY: {mockLeads.length} RECORDS PREPARED
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleExport('JSON')}
                  disabled={exporting !== null}
                  className="bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase px-6 py-4 rounded-xl hover:brightness-110 transition-all shrink-0 min-w-[150px] text-center disabled:opacity-50"
                >
                  {exporting === 'JSON' ? 'EXPORTING...' : 'EXPORT JSON'}
                </button>
              </div>

              {/* Progress Indicator Panel */}
              {exporting && (
                <div className="bg-[#111] border-2 border-zinc-850 rounded-xl p-6 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[#FFBE00] font-black text-xs tracking-widest uppercase flex items-center gap-2">
                      <RefreshCw size={12} className="animate-spin" />
                      GENERATING DATASTREAM EXPORT (. {exporting})
                    </span>
                    <span className="text-white font-black text-xs">{progress}%</span>
                  </div>
                  <div className="w-full bg-black h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#FFBE00] h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_#FFBE00]"
                      style={{ width: progress + '%' }}
                    />
                  </div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-3">
                    Compiling schema attributes, checking proxies, packaging package packets...
                  </div>
                </div>
              )}
            </div>

            {/* Preview Card */}
            <div className="lg:col-span-4">
              <div className="bg-[#111] border border-zinc-900 rounded-xl p-6">
                <div className="flex items-center space-x-2 border-b border-zinc-900 pb-4 mb-4">
                  <BarChart2 size={16} className="text-[#FFBE00]" />
                  <h4 className="font-black text-xs tracking-widest uppercase text-white">EXPORT PREVIEW SUMMARY</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Total lead Rows</span>
                    <span className="text-white font-black text-xs">{mockLeads.length} Rows</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Validation integrity</span>
                    <span className="text-emerald-500 font-black text-xs">100% Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Targeted markets</span>
                    <span className="text-white font-black text-xs">Phoenix Metro, AZ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Scraper Engines</span>
                    <span className="text-white font-black text-xs">G-Maps, Yelp, YellowPages</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
