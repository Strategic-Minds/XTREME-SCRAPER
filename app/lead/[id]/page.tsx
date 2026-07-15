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

  const otherLeads = mockLeads.filter(l => l.id !== lead.id).slice(0, 3);

  return (
    <div className="flex bg-white min-h-screen">
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
                    <div className="flex text-[#F5A000] text-base">
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
                    <MapPin size={16} className="text-[#F5A000]" />
                    <span>{lead.address}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 font-bold">
                    <Briefcase size={16} className="text-[#F5A000]" />
                    <span>{lead.employees} employees</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-500 font-bold">
                    <ShieldCheck size={16} className="text-[#F5A000]" />
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
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 text-[#F5A000] border border-amber-200 text-xs">
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
                  className="w-full h-32 bg-white/80 rounded-xl p-4 border border-yellow-200/80 text-sm font-bold text-black focus:outline-none focus:ring-1 focus:ring-[#F5A000] resize-none shadow-inner"
                />
                <div className="flex justify-end">
                  <button className="px-5 py-2.5 bg-black text-[#F5A000] text-xs font-extrabold tracking-widest uppercase rounded hover:bg-zinc-900 transition-all shadow-md">
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
                
                <a href={`tel:${lead.phone}`} className="w-full">
                  <button className="w-full flex items-center justify-center space-x-2 py-3.5 bg-[#F5A000] hover:bg-amber-500 text-black text-xs font-extrabold tracking-widest uppercase rounded transition-all shadow-md">
                    <Phone size={14} className="stroke-[3]" />
                    <span>{lead.phone}</span>
                  </button>
                </a>

                <a href={lead.website} target="_blank" rel="noreferrer" className="w-full block">
                  <button className="w-full flex items-center justify-center space-x-2 py-3.5 bg-black hover:bg-zinc-950 text-white text-xs font-extrabold tracking-widest uppercase rounded transition-all shadow-md border border-black">
                    <Globe size={14} />
                    <span>Visit Website</span>
                  </button>
                </a>

                <a href={`mailto:${lead.email}`} className="w-full block">
                  <button className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gray-100 hover:bg-gray-200 text-black text-xs font-extrabold tracking-widest uppercase rounded transition-all border border-gray-200">
                    <Mail size={14} />
                    <span>Send Email</span>
                  </button>
                </a>

                <button 
                  onClick={() => setIsSaved(!isSaved)}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 border border-[#F5A000] text-[#F5A000] hover:bg-amber-500/10 text-xs font-extrabold tracking-widest uppercase rounded transition-all"
                >
                  <Star size={14} className={isSaved ? 'fill-[#F5A000]' : ''} />
                  <span>{isSaved ? 'Lead Saved' : 'Save to Leads'}</span>
                </button>

                <button className="w-full flex items-center justify-center space-x-2 py-3.5 border border-gray-300 text-gray-500 hover:text-black hover:border-black text-xs font-extrabold tracking-widest uppercase rounded transition-all">
                  <Download size={14} />
                  <span>Export Lead</span>
                </button>
              </div>

              {/* Source Information */}
              <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
                <h2 className="text-base font-black text-black uppercase tracking-wider border-b border-gray-100 pb-2">Scrape Source Information</h2>
                <div className="space-y-3 text-xs font-bold">
                  <div className="flex justify-between">
                    <span className="text-gray-400 uppercase">Primary Source</span>
                    {getSourceIcon(lead.source)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 uppercase">Date Found</span>
                    <span className="text-black font-black">July 14, 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 uppercase">Time Found</span>
                    <span className="text-black font-black">11:22 AM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 uppercase">Location Searched</span>
                    <span className="text-[#F5A000] font-black">{lead.city}, {lead.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 uppercase">Search Keyword</span>
                    <span className="text-black font-black">Flooring Contractor</span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-black text-[10px] font-black tracking-widest uppercase rounded transition-all border border-gray-200 mt-4">
                  View on Google Maps
                </button>
              </div>
            </div>
          </div>

          {/* Similar Businesses Row */}
          <section className="pt-12 border-t border-gray-100 space-y-6">
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Similar Businesses Near {lead.city}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {otherLeads.map((ol) => (
                <div key={ol.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-[#111] text-white flex items-center justify-center font-bold text-sm tracking-wider">
                        {ol.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-black uppercase tracking-tight text-sm truncate max-w-[160px]">{ol.name}</h3>
                        <span className="text-[10px] font-bold text-gray-400">{ol.city}, {ol.state}</span>
                      </div>
                    </div>
                    {/* Rating stars */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[#F5A000] text-xs">★★★★★</span>
                      <span className="text-xs font-black text-black">{ol.rating}</span>
                    </div>
                  </div>

                  <Link href={`/lead/${ol.id}`} className="mt-4 block w-full">
                    <button className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-black text-[10px] font-black tracking-widest uppercase rounded transition-all border border-gray-200">
                      View Lead
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
