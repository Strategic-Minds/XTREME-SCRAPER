'use client';

import React from 'react';
import Link from 'next/link';
import TopNav from '../../components/TopNav';

export default function AuthPage() {
  const [activeTab, setActiveTab] = React.useState('Create Account');
  const [selectedPlan, setSelectedPlan] = React.useState('Pro');
  const [billingCycle, setBillingCycle] = React.useState('monthly');

  // Input states
  const [fullName, setFullName] = React.useState('Alex Davidson');
  const [email, setEmail] = React.useState('alex@epoxyvalley.com');
  const [password, setPassword] = React.useState('••••••••••••');
  const [toast, setToast] = React.useState('');

  const showToast = (msg) => { 
    setToast(msg); 
    setTimeout(() => setToast(''), 2500); 
  };

  const getPrice = (plan) => {
    let base = 99;
    if (plan === 'Starter') base = 49;
    if (plan === 'Agency') base = 199;

    if (billingCycle === 'yearly') {
      base = Math.round(base * 0.8);
    }
    return base;
  };

  const handleAuth = (e) => {
    e.preventDefault();
    if (activeTab === 'Create Account') {
      showToast('ACCOUNT CREATED - INITIALIZING ' + selectedPlan.toUpperCase());
    } else {
      showToast('SIGNED IN SUCCESSFULLY');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Toast alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase px-6 py-3 rounded-lg shadow-2xl transition-all">
          ✓ {toast}
        </div>
      )}

      <TopNav />

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-6 py-12 gap-12 items-center">
        
        {/* Left side text info */}
        <div className="w-full lg:w-1/2 space-y-6 text-left">
          <span className="text-[#FFBE00] font-black text-xs tracking-widest uppercase">SYSTEM ACCESS CONTROL</span>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-wider leading-none">
            UNLEASH THE POWER OF <span className="text-[#FFBE00]">XTREME</span> DATA
          </h1>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-lg">
            Create your credential access node to instantly launch real-time multi-source scrape sequences. Save, export, and automate local leads with zero proxy headache.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-6 max-w-md">
            <div className="bg-[#111] border border-zinc-900 rounded-xl p-4">
              <span className="block text-[#FFBE00] font-black text-lg">10+</span>
              <span className="block text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Premium scraper sources</span>
            </div>
            <div className="bg-[#111] border border-zinc-900 rounded-xl p-4">
              <span className="block text-[#FFBE00] font-black text-lg">100%</span>
              <span className="block text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-1">Automatic anti-ban proxies</span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full lg:w-1/2 max-w-xl">
          <div className="bg-[#111] border border-zinc-850 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-32 h-24 bg-[#FFBE00]/5 rounded-full blur-2xl" />
            
            {/* Tab selector */}
            <div className="flex bg-black p-1 rounded-xl border border-zinc-900 mb-8">
              <button 
                type="button"
                onClick={() => setActiveTab('Create Account')}
                className={'flex-1 py-3 text-center text-xs font-black tracking-widest uppercase rounded-lg transition-all ' + (
                  activeTab === 'Create Account' ? 'bg-[#FFBE00] text-black' : 'text-zinc-400 hover:text-white'
                )}
              >
                CREATE ACCOUNT
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('Sign In')}
                className={'flex-1 py-3 text-center text-xs font-black tracking-widest uppercase rounded-lg transition-all ' + (
                  activeTab === 'Sign In' ? 'bg-[#FFBE00] text-black' : 'text-zinc-400 hover:text-white'
                )}
              >
                SIGN IN
              </button>
            </div>

            {/* Main Auth Form */}
            <form onSubmit={handleAuth} className="space-y-6">
              
              {activeTab === 'Create Account' && (
                <div>
                  <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">FULL NAME</label>
                  <input 
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black border border-zinc-900 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFBE00] focus:border-[#FFBE00] font-bold transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">EMAIL ADDRESS</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-900 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFBE00] focus:border-[#FFBE00] font-bold transition-all"
                />
              </div>

              <div>
                <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest mb-1.5">PASSWORD</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-900 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FFBE00] focus:border-[#FFBE00] font-bold transition-all"
                />
              </div>

              {/* Plan selector if Create Account */}
              {activeTab === 'Create Account' && (
                <div className="space-y-4 border-t border-zinc-900 pt-6">
                  <div className="flex justify-between items-center">
                    <label className="block text-[#888] font-bold text-[9px] uppercase tracking-widest">SELECT ACTIVE MEMBERSHIP</label>
                    <div className="flex items-center space-x-2 bg-black border border-zinc-900 p-0.5 rounded-lg">
                      <button 
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={'px-3 py-1.5 text-[8px] font-black tracking-widest uppercase rounded ' + (billingCycle === 'monthly' ? 'bg-[#FFBE00] text-black' : 'text-zinc-500 hover:text-white')}
                      >
                        MONTH
                      </button>
                      <button 
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={'px-3 py-1.5 text-[8px] font-black tracking-widest uppercase rounded ' + (billingCycle === 'yearly' ? 'bg-[#FFBE00] text-black' : 'text-zinc-500 hover:text-white')}
                      >
                        YEAR
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {['Starter', 'Pro', 'Agency'].map((p) => {
                      const isSel = selectedPlan === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSelectedPlan(p)}
                          className={'flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center ' + (
                            isSel 
                              ? 'bg-zinc-950 border-[#FFBE00] shadow-[0_0_10px_rgba(255,190,0,0.15)]' 
                              : 'bg-black border-zinc-900 hover:border-zinc-800'
                          )}
                        >
                          <span className={'block text-[10px] font-black tracking-widest uppercase ' + (isSel ? 'text-[#FFBE00]' : 'text-zinc-400')}>{p}</span>
                          <span className="block text-white font-black text-sm mt-1">{"$" + getPrice(p)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-[#FFBE00] text-black font-black text-xs tracking-widest uppercase py-4 rounded-xl hover:brightness-110 transition-all mt-4"
              >
                {activeTab === 'Create Account' ? 'CREATE SECURE ACCOUNT' : 'SECURE SIGN IN'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
