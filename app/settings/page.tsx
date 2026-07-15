'use client';
import React from 'react';
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import Link from 'next/link';

export default function SettingsPage() {
  const [saved, setSaved] = React.useState(false);
  const [plan, setPlan] = React.useState('Pro');
  const [email, setEmail] = React.useState('alex@epoxyvalley.com');
  const [notifs, setNotifs] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex bg-white min-h-screen">
      {saved && <div className="fixed top-6 right-6 z-50 bg-black text-[#FFBE00] font-black text-xs tracking-widest uppercase px-6 py-3 rounded shadow-2xl">✓ SETTINGS SAVED</div>}
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <div className="p-12 max-w-3xl mx-auto w-full space-y-10">
          <div className="pb-6 border-b border-gray-100">
            <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">ACCOUNT</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-black uppercase mt-1">SETTINGS</h1>
          </div>
          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-4">
              <h2 className="font-black text-sm uppercase tracking-wider border-b border-gray-100 pb-2">Profile</h2>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-bold mt-1 focus:outline-none focus:border-[#FFBE00] transition-all" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="font-black text-sm uppercase tracking-wider border-b border-gray-100 pb-2">Plan</h2>
              <div className="flex items-center space-x-4">
                {['Starter', 'Pro', 'Agency'].map(p => (
                  <button key={p} type="button" onClick={() => setPlan(p)} className={`px-5 py-2.5 rounded font-black text-xs uppercase tracking-widest transition-all ${plan === p ? 'bg-[#FFBE00] text-black' : 'border border-gray-200 text-gray-600 hover:border-black'}`}>{p}</button>
                ))}
              </div>
              <p className="text-xs text-gray-400">Current plan: <strong>{plan}</strong> · <Link href="/auth" className="text-[#FFBE00] font-black hover:underline">Upgrade plan</Link></p>
            </div>
            <div className="space-y-4">
              <h2 className="font-black text-sm uppercase tracking-wider border-b border-gray-100 pb-2">Preferences</h2>
              <label className="flex items-center space-x-3 cursor-pointer">
                <div onClick={() => setNotifs(!notifs)} className={`w-10 h-5 rounded-full transition-all ${notifs ? 'bg-[#FFBE00]' : 'bg-gray-200'} flex items-center px-0.5`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-bold">Email notifications for new leads</span>
              </label>
            </div>
            <button type="submit" className="bg-[#FFBE00] hover:bg-amber-500 text-black font-black text-xs tracking-widest uppercase px-10 py-3.5 rounded shadow transition-all">
              SAVE CHANGES
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
