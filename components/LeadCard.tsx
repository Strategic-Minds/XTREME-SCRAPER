import React from 'react';
import Link from 'next/link';
import { Lead } from '../lib/mockData';

interface LeadCardProps {
  lead: Lead;
}

export default function LeadCard({ lead }: LeadCardProps) {
  // Source badge custom icons/colors
  const renderSourceBadge = () => {
    switch (lead.source) {
      case 'Google':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded border border-blue-200">
            <span className="text-red-500 font-black">G</span>
            <span className="text-blue-500 font-bold">oogle</span>
          </span>
        );
      case 'Yelp':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase rounded border border-red-200">
            <span className="text-red-600 font-bold">Yelp</span>
          </span>
        );
      case 'YellowPages':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-1 bg-yellow-50 text-yellow-800 text-[10px] font-black uppercase rounded border border-yellow-200">
            <span className="bg-yellow-400 text-black px-1 rounded font-black mr-1">YP</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start md:items-center space-x-5">
        {/* Dark logo placeholder */}
        <div className="w-16 h-16 rounded-xl bg-[#111111] border border-gray-800 flex items-center justify-center text-white font-extrabold text-lg tracking-wider shrink-0 shadow-inner">
          {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>

        <div className="flex flex-col space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-black tracking-tight">{lead.name}</h3>
            {lead.isVerified && (
              <span className="inline-flex items-center text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                ✓ Verified
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 font-bold">
            <span className="flex items-center">📍 {lead.city}, {lead.state}</span>
            <span className="text-gray-300">|</span>
            <span>📞 {lead.phone}</span>
            <span className="text-gray-300">|</span>
            <span className="truncate max-w-xs">🌐 {lead.website}</span>
          </div>

          {/* Rating stars */}
          <div className="flex items-center space-x-2 pt-1">
            <div className="flex text-[#F5A000] text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <span className="text-sm font-black text-black">{lead.rating}</span>
            <span className="text-xs text-gray-400 font-bold">({lead.reviewsCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 w-full md:w-auto shrink-0 justify-end">
        {renderSourceBadge()}
        <Link href={`/lead/${lead.id}`}>
          <button className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-black text-xs font-extrabold tracking-widest uppercase rounded transition-all border border-gray-200">
            VIEW DETAILS
          </button>
        </Link>
        <button className="px-5 py-2.5 bg-[#F5A000] hover:bg-amber-500 text-black text-xs font-extrabold tracking-widest uppercase rounded transition-all shadow-md">
          SAVE
        </button>
      </div>
    </div>
  );
}
