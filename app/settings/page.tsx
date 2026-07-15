'use client';
import React from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import { User, Bell, Shield, CreditCard, Key } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = React.useState(false);
  const [plan, setPlan] = React.useState('Pro');
  const [email, setEmail] = React.useState('alex@epoxyvalley.com');
  const [apiKey, setApiKey] = React.useState('xs_live_92038491028394018274920');
  const [notifs, setNotifs] = React.useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex bg-black min-h-screen text-white font-sans">
      {/* Premium Toast Notification */}
      {saved && (
        <div className="fixed top-6 right-6 z-50 bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase px-6 py-3 rounded-lg shadow-[0_0_15px_#FFBE00] transition-all">
          ✓ SETTINGS SAVED
        </div>
      )}
      
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <div className="p-8 max-w-5xl mx-auto w-full">
          
          {/* Header */}
          <div className="mb-10">
            <span className="text-[#888] font-bold text-[10px] uppercase tracking-widest">WORKSPACE / PREFERENCES</span>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider mt-1">SYSTEM SETTINGS</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form Section */}
            <form onSubmit={handleSave} className="lg:col-span-8 space-y-6">
              
              {/* Account Card */}
              <div className="bg-[#111] border border-zinc-900 rounded-xl p-6">
                <div className="flex items-center space-x-2 border-b border-zinc-900 pb-4 mb-6">
                  <User size={16} className="text-[#FFBE00]" />
                  <h2 className="font-black text-xs tracking-widest uppercase text-white">ACCOUNT CREDENTIALS</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black border border-zinc-900 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFBE00] focus:border-[#FFBE00] font-bold transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">API TOKEN</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-black border border-zinc-900 text-[#FFBE00] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFBE00] focus:border-[#FFBE00] font-mono transition-all"
                      />
                      <Key size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Card */}
              <div className="bg-[#111] border border-zinc-900 rounded-xl p-6">
                <div className="flex items-center space-x-2 border-b border-zinc-900 pb-4 mb-6">
                  <Bell size={16} className="text-[#FFBE00]" />
                  <h2 className="font-black text-xs tracking-widest uppercase text-white">ALERTS & WEBHOOKS</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-black uppercase tracking-wider text-white">CRITICAL EXPORT WEBHOOKS</span>
                    <span className="block text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Dispatch real-time webhooks on download compilation completion.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNotifs(!notifs)}
                    className={'w-12 h-6 rounded-full p-1 transition-all ' + (notifs ? 'bg-[#FFBE00]' : 'bg-zinc-800')}
                  >
                    <div className={'w-4 h-4 rounded-full bg-black transition-all ' + (notifs ? 'translate-x-6' : 'translate-x-0')} />
                  </button>
                </div>
              </div>

              {/* Save CTA */}
              <button 
                type="submit"
                className="w-full bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase py-4 rounded-xl hover:brightness-110 transition-all"
              >
                SAVE SYSTEM CONFIGURATION
              </button>
            </form>

            {/* Premium Plan Cards */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#111] border-2 border-[#FFBE00] rounded-xl p-6 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#FFBE00]/5 rounded-full blur-xl" />
                <div className="flex items-center space-x-2 border-b border-zinc-900 pb-4 mb-4">
                  <CreditCard size={16} className="text-[#FFBE00]" />
                  <h3 className="font-black text-xs tracking-widest uppercase text-white">CURRENT SUBSCRIPTION</h3>
                </div>
                
                <div className="my-4">
                  <span className="text-xs font-black text-[#FFBE00] uppercase tracking-widest px-3 py-1 bg-[#FFBE00]/10 border border-[#FFBE00]/20 rounded-full">
                    {plan.toUpperCase()} ACTIVE
                  </span>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-black text-white">9</span>
                    <span className="text-zinc-500 font-bold text-xs ml-1">/ month</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-zinc-900 pt-4 text-xs font-bold text-zinc-400">
                  <div className="flex justify-between">
                    <span>LEADS DOWNLOADED</span>
                    <span className="text-white font-black">4,120 / 10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ACTIVE CRONS</span>
                    <span className="text-white font-black">4 / 5 Active</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111] border border-zinc-900 rounded-xl p-6 text-center">
                <h4 className="font-black text-xs tracking-widest uppercase text-white">NEED ENTERPRISE RATE LIMITS?</h4>
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2 leading-relaxed">Get custom proxies, dedicated scrape nodes, and direct webhook integrations.</p>
                <button 
                  type="button"
                  onClick={() => alert('REACH OUT TO SALES AT PARTNERS@STRATEGICMINDS.COM')}
                  className="mt-4 w-full bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 text-white font-black text-[10px] tracking-widest uppercase py-3 rounded-lg transition-all"
                >
                  CONTACT SALES DEPT
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
