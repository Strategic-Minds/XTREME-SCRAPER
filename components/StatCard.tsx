import React from 'react';
import { Search, Users, Star, Download } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  icon: string;
}

export default function StatCard({ label, value, delta, icon }: StatCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'Search': return <Search className="text-[#F5A000]" size={20} />;
      case 'Users': return <Users className="text-[#F5A000]" size={20} />;
      case 'Star': return <Star className="text-[#F5A000]" size={20} />;
      case 'Download': return <Download className="text-[#F5A000]" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col space-y-1">
        <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{label}</span>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-black tracking-tight">{value}</span>
          <span className="text-xs font-black text-green-500">{delta}</span>
        </div>
      </div>
      <div className="w-10 h-10 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center shrink-0">
        {getIcon()}
      </div>
    </div>
  );
}
