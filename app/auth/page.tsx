'use client';

import React from 'react';
import Link from 'next/link';
import TopNav from '../../components/TopNav';

export default function AuthPage() {
  const [activeTab, setActiveTab] = React.useState<'Sign In' | 'Create Account'>('Create Account');
  const [selectedPlan, setSelectedPlan] = React.useState<'Starter' | 'Pro' | 'Agency'>('Pro');
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');

  // Input states
  const [fullName, setFullName] = React.useState('Alex Davidson');
  const [email, setEmail] = React.useState('alex@epoxyvalley.com');
  const [password, setPassword] = React.useState('••••••••••••');
  const [confirmPassword, setConfirmPassword] = React.useState('••••••••••••');

  const getPrice = (plan: 'Starter' | 'Pro' | 'Agency') => {
    let base = 99;
    if (plan === 'Starter') base = 49;
    if (plan === 'Agency') base = 199;

    if (billingCycle === 'yearly') {
      base = Math.round(base * 0.8);
    }
    return base;
  };

  const getLeadsCount = (plan: 'Starter' | 'Pro' | 'Agency') => {
    if (plan === 'Starter') return '500';
    if (plan === 'Pro') return '2,000';
    return '5,000';
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Success! Logged in as ${email} on the ${selectedPlan} plan (${billingCycle} billing). Redirecting you to the workspace...`);
    window.location.href = '/dashboard';
  };

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      <TopNav />

      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 w-full max-w-[1440px] mx-auto">
        {/* Left Side: Auth Forms & Core Mission Statements (Black Background) */}
        <section className="bg-black text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#FFBE00_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />

          {/* Core Branding/Message */}
          <div className="relative z-10 space-y-6 max-w-lg mb-12">
            {/* FULL BADGE LOGO */}
            <img 
              src="https://media.base44.com/images/public/69db047707a15d69135e3de9/53ab5dec5_ChatGPTImageJul14202610_12_56PM1.png" 
              style={{ height: '120px' }} 
              className="object-contain" 
              alt="XTREME SCRAPER Full Badge" 
            />

            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase pt-6">
              UNLOCK THE POWER TO FIND.<br />
              <span className="text-[#FFBE00] italic">SAVE. GROW.</span>
            </h1>
            <p className="text-gray-400 font-bold text-sm leading-relaxed">
              Start building verified pipelines of local flooring contracts, general construction leads, and commercial projects in under 30 seconds.
            </p>

            {/* Core Trust Checklist */}
            <div className="space-y-3 pt-4 text-xs font-black tracking-wider text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="text-[#FFBE00]">✓</span> <span>124K+ LEADS SCAPEABLE TODAY</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#FFBE00]">✓</span> <span>GOOGLE, YELP & YELLOW PAGES CONNECTED</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#FFBE00]">✓</span> <span>EXPORT UNLIMITED CLEAN CSV FILES</span>
              </div>
            </div>
          </div>

          {/* Sign In / Sign Up Form Box */}
          <div className="relative z-10 bg-zinc-950 border border-zinc-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            {/* Form Toggle Header */}
            <div className="flex border-b border-zinc-900 mb-6">
              {['Sign In', 'Create Account'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === tab 
                      ? 'border-b-2 border-[#FFBE00] text-[#FFBE00]' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Inputs Block */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {activeTab === 'Create Account' && (
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#FFBE00]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#FFBE00]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#FFBE00]"
                />
              </div>

              {activeTab === 'Create Account' && (
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#FFBE00]"
                  />
                </div>
              )}

              {/* Core CTA */}
              <button type="submit" className="w-full py-3.5 bg-[#FFBE00] hover:bg-amber-500 text-black text-xs font-extrabold tracking-widest uppercase rounded-lg transition-all shadow-md mt-2">
                {activeTab === 'Create Account' ? 'CREATE ACCOUNT & START' : 'SIGN IN TO WORKSPACE'}
              </button>

              {/* Divider */}
              <div className="flex items-center space-x-3 py-2">
                <div className="flex-1 h-px bg-zinc-900" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-zinc-900" />
              </div>

              {/* Google Button */}
              <button type="button" onClick={() => alert('Redirecting to Google OAuth authentication window...')} className="w-full flex items-center justify-center space-x-2 py-3.5 border border-zinc-800 bg-transparent hover:bg-zinc-900 text-white text-xs font-extrabold tracking-widest uppercase rounded-lg transition-all">
                <span className="text-red-500 font-extrabold">G</span>
                <span>CONTINUE WITH GOOGLE</span>
              </button>

              <p className="text-[10px] text-zinc-600 font-bold leading-relaxed text-center pt-2">
                By pressing button above, you agree to our Terms of Service & Privacy Policy rules.
              </p>
            </form>
          </div>
        </section>

        {/* Right Side: Plan Pricing & Checkout Details (White Background) */}
        <section className="p-8 md:p-16 space-y-10 bg-white border-l border-gray-100 flex flex-col justify-center">
          
          {/* Section 1 Heading */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-black uppercase tracking-tight">1. Choose Your Plan</h2>
              
              {/* Month/Year toggle */}
              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-full">
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-wider transition-all ${
                    billingCycle === 'monthly' ? 'bg-black text-[#FFBE00]' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-wider transition-all ${
                    billingCycle === 'yearly' ? 'bg-black text-[#FFBE00]' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Yearly <span className="text-[#FFBE00] text-[9px] font-black ml-0.5">-20%</span>
                </button>
              </div>
            </div>

            {/* Plan Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Starter', 'Pro', 'Agency'].map((plan) => {
                const price = getPrice(plan as any);
                const leads = getLeadsCount(plan as any);
                const isSelected = selectedPlan === plan;

                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan as any)}
                    className={`rounded-xl p-5 border text-left flex flex-col justify-between h-40 relative transition-all ${
                      isSelected 
                        ? 'border-[#FFBE00] bg-[#FFBE00]/5 ring-2 ring-[#FFBE00]' 
                        : 'border-gray-200 hover:border-gray-400 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-[#FFBE00] text-xs font-black">✓ Selected</span>
                    )}
                    <div>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{plan}</span>
                      <h3 className="text-2xl font-extrabold text-black pt-1">
                        ${price}<span className="text-[11px] font-bold text-gray-400">/mo</span>
                      </h3>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-relaxed">
                      {leads} verified leads per billing node cycle.
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
