'use client';

import React from 'react';
import Link from 'next/link';
import TopNav from '../../components/TopNav';
import Logo from '../../components/Logo';

export default function AuthPage() {
  const [activeTab, setActiveTab] = React.useState<'signin' | 'create'>('Create Account');
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

  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      <TopNav />

      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 w-full max-w-[1440px] mx-auto">
        {/* Left Side: Auth Forms & Core Mission Statements (Black Background) */}
        <section className="bg-black text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#F5A000_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />

          {/* Core Branding/Message */}
          <div className="relative z-10 space-y-6 max-w-lg mb-12">
            <Logo />
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase pt-6">
              UNLOCK THE POWER TO FIND.<br />
              <span className="text-[#F5A000] italic">SAVE. GROW.</span>
            </h1>
            <p className="text-gray-400 font-bold text-sm leading-relaxed">
              Start building verified pipelines of local flooring contracts, general construction leads, and commercial projects in under 30 seconds.
            </p>

            {/* Core Trust Checklist */}
            <div className="space-y-3 pt-4 text-xs font-black tracking-wider text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="text-[#F5A000]">✓</span> <span>124K+ LEADS SCAPEABLE TODAY</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#F5A000]">✓</span> <span>GOOGLE, YELP & YELLOW PAGES CONNECTED</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[#F5A000]">✓</span> <span>EXPORT UNLIMITED CLEAN CSV FILES</span>
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
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === tab 
                      ? 'border-b-2 border-[#F5A000] text-[#F5A000]' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Inputs Block */}
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {activeTab === 'Create Account' && (
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#F5A000]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#F5A000]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#F5A000]"
                />
              </div>

              {activeTab === 'Create Account' && (
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1.5">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#F5A000]"
                  />
                </div>
              )}

              {/* Core CTA */}
              <Link href="/dashboard" className="block w-full pt-2">
                <button className="w-full py-3.5 bg-[#F5A000] hover:bg-amber-500 text-black text-xs font-extrabold tracking-widest uppercase rounded-lg transition-all shadow-md">
                  {activeTab === 'Create Account' ? 'CREATE ACCOUNT' : 'SIGN IN TO XS'}
                </button>
              </Link>

              {/* Divider */}
              <div className="flex items-center space-x-3 py-2">
                <div className="flex-1 h-px bg-zinc-900" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-zinc-900" />
              </div>

              {/* Google Button */}
              <button className="w-full flex items-center justify-center space-x-2 py-3.5 border border-zinc-800 bg-transparent hover:bg-zinc-900 text-white text-xs font-extrabold tracking-widest uppercase rounded-lg transition-all">
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
                    billingCycle === 'monthly' ? 'bg-black text-[#F5A000]' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-wider transition-all ${
                    billingCycle === 'yearly' ? 'bg-black text-[#F5A000]' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  Yearly <span className="text-[#F5A000] text-[9px] font-black ml-0.5">-20%</span>
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
                        ? 'border-2 border-[#F5A000] bg-amber-50/5 shadow-md shadow-[#F5A000]/5' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                    }`}
                  >
                    {plan === 'Pro' && (
                      <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-[#F5A000] text-black text-[8px] font-black tracking-widest uppercase rounded">
                        MOST POPULAR
                      </span>
                    )}

                    <div>
                      <span className="block font-black text-xs uppercase tracking-wider text-black">{plan}</span>
                      <span className="block text-gray-400 font-bold text-[11px] mt-1">{leads} leads / mo</span>
                    </div>

                    <div className="flex items-baseline space-x-1 pt-4">
                      <span className="text-2xl font-black text-black">${price}</span>
                      <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">/ mo</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2 Heading */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 className="text-lg font-black text-black uppercase tracking-tight">2. Payment Details</h2>
              
              {/* Payment Card Logos */}
              <div className="flex items-center space-x-1.5 text-gray-400 text-sm font-black">
                <span>💳</span>
                <span className="text-[10px] uppercase tracking-wider">Visa / MC / Amex / Disc</span>
              </div>
            </div>

            {/* Fake Payment Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Card Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value="4111 2222 3333 4444" 
                    readOnly
                    className="w-full border border-gray-200 rounded-lg p-3 text-xs font-bold text-black bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#F5A000]"
                  />
                  <span className="absolute right-3 top-3.5 text-xs">🔒</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Expiry Date</label>
                  <input 
                    type="text" 
                    value="12 / 29" 
                    readOnly
                    className="w-full border border-gray-200 rounded-lg p-3 text-xs font-bold text-black bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#F5A000]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">CVC</label>
                  <input 
                    type="text" 
                    value="•••" 
                    readOnly
                    className="w-full border border-gray-200 rounded-lg p-3 text-xs font-bold text-black bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#F5A000]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Cardholder Name</label>
                  <input 
                    type="text" 
                    value="Alex Davidson" 
                    readOnly
                    className="w-full border border-gray-200 rounded-lg p-3 text-xs font-bold text-black bg-gray-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Country</label>
                  <input 
                    type="text" 
                    value="United States" 
                    readOnly
                    className="w-full border border-gray-200 rounded-lg p-3 text-xs font-bold text-black bg-gray-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">ZIP Code</label>
                  <input 
                    type="text" 
                    value="85015" 
                    readOnly
                    className="w-full border border-gray-200 rounded-lg p-3 text-xs font-bold text-black bg-gray-50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Order Summary */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
            <h3 className="text-xs font-black text-black uppercase tracking-widest">Order Summary</h3>
            
            <div className="space-y-2 text-xs font-bold text-gray-600">
              <div className="flex justify-between">
                <span>{selectedPlan} Plan ({billingCycle})</span>
                <span className="text-black font-black">${getPrice(selectedPlan)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT / Tax</span>
                <span className="text-black font-black">$0.00</span>
              </div>
              
              <div className="flex justify-between border-t border-gray-200 pt-3 text-sm font-black">
                <span className="text-black uppercase">TOTAL DUE TODAY</span>
                <span className="text-[#F5A000]">${getPrice(selectedPlan)}.00</span>
              </div>
            </div>
          </div>

          {/* Subscribe Submit button */}
          <div className="space-y-3 pt-4">
            <Link href="/dashboard" className="block w-full">
              <button className="w-full py-4 bg-[#F5A000] hover:bg-amber-500 text-black text-xs font-extrabold tracking-widest uppercase rounded-lg transition-all shadow-lg flex items-center justify-center space-x-2">
                <span>🔒 START SUBSCRIPTION</span>
              </button>
            </Link>

            <span className="block text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
              100% Secure Checkout. Your payment is protected.
            </span>
          </div>

        </section>
      </div>
    </main>
  );
}
