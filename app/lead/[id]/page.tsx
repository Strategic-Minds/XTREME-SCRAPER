'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';
import { mockLeads, Lead } from '../../../lib/mockData';
import { ArrowLeft, Check, Star, Mail, Globe, Phone, Download, MapPin, Briefcase, Calendar, ShieldCheck, FileText } from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function LeadDetail({ params }: PageProps) {
  const router = useRouter();
  const [toast, setToast] = React.useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const leadId = params.id;
  const lead = mockLeads.find(l => l.id === leadId) || mockLeads[0];

  const [notes, setNotes] = React.useState(lead.notes || '');
  const [isSaved, setIsSaved] = React.useState(true);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Google':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-black uppercase rounded border border-blue-200">
            <span className="text-red-500 font-black">G</span>
            <span className="text-blue-500 font-bold">oogle</span>
          </span>
        );
      case 'Yelp':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs font-black uppercase rounded border border-red-200">
            <span className="text-red-600 font-bold">Yelp</span>
          </span>
        );
      case 'YellowPages':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-yellow-50 text-yellow-800 text-xs font-black uppercase rounded border border-yellow-200">
            <span className="bg-yellow-400 text-black px-1 rounded font-black mr-1">YP</span>
          </span>
        );
    }
  };

  const handleCall = () => {
    window.open(`tel:${lead.phone}`, '_self');
  };

  const handleEmail = () => {
    window.open(`mailto:${lead.email || 'info@' + lead.website}`, '_self');
  };

  const handleSaveNotes = () => {
    showToast('✓ Notes saved');
  };

  const handleToggleSave = () => {
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    showToast(nextSaved ? '★ Saved to memory' : '✕ Removed from memory');
  };

  const handleDownloadProfile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lead, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `lead_profile_${lead.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('✓ Downloaded');
  };

  const otherLeads = mockLeads.filter(l => l.id !== lead.id).slice(0, 3);

  return (
    <div className="flex bg-white min-h-screen">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-black text-[#FFBE00] font-black text-xs tracking-widest uppercase px-6 py-3 rounded shadow-2xl border border-[#FFBE00]/30">
          {toast}
        </div>
      )}
      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <TopNav />

        {/* Inner Content */}
        <div className="p-8 md:p-12 space-y-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Back Action Bar */}
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-sm font-black text-gray-500 hover:text-black uppercase tracking-widest transition-colors"
            >
              <ArrowLeft size={16} className="stroke-[3]" />
              <span>Back to Results</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel: Profile Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Profile Box */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col md:flex-row gap-6">
                {/* Logo Badge */}
                <div className="w-24 h-24 rounded-2xl bg-[#111] text-white flex items-center justify-center font-black text-3xl tracking-widest border border-gray-800 shrink-0 shadow-lg">
                  {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <div className="flex flex-col space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight leading-none uppercase">{lead.name}</h1>
                    {lead.isVerified && (
                      <span className="inline-flex items-center text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center space-x-2">
                    <div className="flex text-[#FFBE00] text-base">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <span className="text-sm font-black text-black">{lead.rating}</span>
                    <span className="text-xs text-gray-400 font-bold">({lead.reviewsCount} reviews)</span>
                  </div>

                  {/* Quick Pill Row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded">
                      {lead.category}
                    </span>
                    <span className="px-2.5 py-1 bg-neutral-100 border border-neutral-300 text-neutral-800 text-[10px] font-black uppercase tracking-wider rounded">
                      Service Provider
                    </span>
                    <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black uppercase tracking-wider rounded">
                      Since {lead.since}
                    </span>
                  </div>
                </div>
              </div>

              {/* Business Description */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
                <h2 className="text-lg font-black text-black uppercase tracking-tight">About this Business</h2>
                <p className="text-gray-600 font-bold text-sm leading-relaxed">{lead.description}</p>

                {/* Sub Metadata Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-100 text-xs">
                  <div className="flex items-center space-x-2 text-gray-500 font-bold">
                    <MapPin size={16} className="text-[#FFBE00]" />
                    <span>{lead.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 font-bold">
                    <Briefcase size={16} className="text-[#FFBE00]" />
                    <span>{lead.employees} employees</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 font-bold">
                    <ShieldCheck size={16} className="text-[#FFBE00]" />
                    <span>{lead.licensed ? 'Licensed Contractor' : 'Not Certified'}</span>
                  </div>
                </div>
              </div>

              {/* Services List */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
                <h2 className="text-lg font-black text-black uppercase tracking-tight">Offered Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.services.map((service, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-sm font-bold text-gray-700">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 text-[#FFBE00] border border-amber-200 text-xs">
                        ✓
                      </span>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags Section */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
                <h2 className="text-lg font-black text-black uppercase tracking-tight">Lead Classification Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag) => (
                    <span 
                      key={tag} 
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes Container (Yellow Background Card) */}
              <div className="bg-yellow-50/50 border border-yellow-200/60 rounded-2xl p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-black uppercase tracking-tight">Internal Scrape Notes</h2>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lead.notesTimestamp || 'No Timestamp'}</span>
                </div>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type any private updates, callback timelines, or notes here..." 
                  className="w-full h-32 bg-white/80 rounded-xl p-4 border border-yellow-200/80 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#FFBE00] resize-none shadow-inner"
                />
                <div className="flex justify-end">
                  <button onClick={handleSaveNotes} className="px-5 py-2.5 bg-black text-[#FFBE00] text-xs font-extrabold tracking-widest uppercase rounded hover:bg-zinc-900 transition-all shadow-md">
                    Save Notes
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel: CTAs & Meta Information */}
            <div className="space-y-8">
              {/* Call to Actions Panel */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4 shadow-sm">
                <h2 className="text-base font-black text-black uppercase tracking-wider border-b border-gray-100 pb-2">Direct Contact</h2>
                
                <button 
                  onClick={handleCall}
                  className="w-full flex items-center justify-center space-x-3 py-3.5 bg-black hover:bg-zinc-900 text-[#FFBE00] font-black text-xs tracking-widest uppercase rounded-xl transition-all shadow-md"
                >
                  <Phone size={14} className="stroke-[3]" />
                  <span>Call: {lead.phone}</span>
                </button>

                <button 
                  onClick={handleEmail}
                  className="w-full flex items-center justify-center space-x-3 py-3.5 border-2 border-gray-200 hover:border-black bg-white text-black font-black text-xs tracking-widest uppercase rounded-xl transition-all"
                >
                  <Mail size={14} className="stroke-[2.5]" />
                  <span>Send Direct Email</span>
                </button>

                <div className="flex items-center space-x-3 pt-2">
                  <button 
                    onClick={handleToggleSave}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 bg-zinc-100 hover:bg-zinc-200 text-black font-black text-[11px] tracking-wider uppercase rounded-lg transition-all ${
                      isSaved ? 'ring-2 ring-[#FFBE00] bg-[#FFBE00]/10' : ''
                    }`}
                  >
                    <Star size={12} className={isSaved ? 'fill-[#FFBE00] text-[#FFBE00]' : ''} />
                    <span>{isSaved ? 'Saved to Memory' : 'Save Lead'}</span>
                  </button>
                  <button 
                    onClick={handleDownloadProfile}
                    className="p-3 bg-zinc-100 hover:bg-zinc-200 text-black rounded-lg transition-all"
                    title="Download Lead JSON"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
