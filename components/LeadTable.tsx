import React from 'react';
import Link from 'next/link';
import { Lead } from '../lib/mockData';
import { MoreVertical, Star, Check } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onToggleSave?: (id: string) => void;
  savedIds?: string[];
}

export default function LeadTable({ leads, onToggleSave, savedIds = [] }: LeadTableProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Google':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-50 border border-blue-200 text-blue-600 font-black text-xs">
            G
          </span>
        );
      case 'Yelp':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-50 border border-red-200 text-red-600 font-bold text-xs">
            Y
          </span>
        );
      case 'YellowPages':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-50 border border-yellow-200 text-yellow-700 font-black text-[10px]">
            YP
          </span>
        );
      default:
        return null;
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'epoxy': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'flooring': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'contractor': return 'bg-neutral-100 text-neutral-800 border-neutral-300';
      case 'garage': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'luxury': return 'bg-yellow-50 text-yellow-900 border-yellow-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="p-4 w-12 text-center">
              <input type="checkbox" className="rounded border-gray-300 text-[#F5A000] focus:ring-[#F5A000]" />
            </th>
            <th className="p-4 w-10"></th>
            <th className="p-4 font-black text-gray-500 uppercase tracking-widest text-xs">BUSINESS NAME</th>
            <th className="p-4 font-black text-gray-500 uppercase tracking-widest text-xs">CATEGORY</th>
            <th className="p-4 font-black text-gray-500 uppercase tracking-widest text-xs">LOCATION</th>
            <th className="p-4 font-black text-gray-500 uppercase tracking-widest text-xs">PHONE</th>
            <th className="p-4 font-black text-gray-500 uppercase tracking-widest text-xs">SOURCE</th>
            <th className="p-4 font-black text-gray-500 uppercase tracking-widest text-xs text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead) => {
            const isSaved = savedIds.includes(lead.id);
            return (
              <tr key={lead.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="p-4 text-center">
                  <input type="checkbox" className="rounded border-gray-300 text-[#F5A000] focus:ring-[#F5A000]" />
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => onToggleSave?.(lead.id)}
                    className="focus:outline-none"
                  >
                    <Star 
                      size={18} 
                      className={`transition-colors ${isSaved ? 'fill-[#F5A000] text-[#F5A000]' : 'text-gray-300 hover:text-[#F5A000]'}`} 
                    />
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded bg-[#111] text-white flex items-center justify-center font-bold text-xs tracking-wider border border-gray-800">
                      {lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-black hover:text-[#F5A000] transition-colors">
                          {lead.name}
                        </span>
                        {lead.isVerified && (
                          <span className="inline-flex items-center justify-center w-4 h-4 bg-green-50 border border-green-200 text-green-600 rounded-full text-[9px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        {lead.tags.slice(0, 2).map((tag) => (
                          <span 
                            key={tag} 
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border ${getTagColor(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-gray-600 font-bold text-xs">{lead.category}</span>
                </td>
                <td className="p-4">
                  <span className="text-gray-600 font-bold text-xs">{lead.city}, {lead.state}</span>
                </td>
                <td className="p-4">
                  <span className="text-gray-600 font-bold text-xs">{lead.phone}</span>
                </td>
                <td className="p-4">
                  {getSourceIcon(lead.source)}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Link href={`/lead/${lead.id}`}>
                      <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-black text-[10px] font-black tracking-widest uppercase rounded border border-gray-200 transition-all">
                        VIEW
                      </button>
                    </Link>
                    <button className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
