import React from 'react';

export default function Logo() {
  return (
    <div className="flex items-center space-x-3 select-none">
      {/* Black and Gold Hexagonal Shield with XS inside */}
      <div className="relative flex items-center justify-center w-10 h-11 bg-black rounded-lg border-2 border-[#F5A000] shadow-[0_0_10px_rgba(245,160,0,0.3)]">
        {/* Crown/Wings top motif */}
        <div className="absolute -top-1.5 flex space-x-1">
          <div className="w-1.5 h-1.5 bg-[#F5A000] rotate-45 rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#F5A000] rotate-45 rounded-sm"></div>
          <div className="w-1.5 h-1.5 bg-[#F5A000] rotate-45 rounded-sm"></div>
        </div>
        <span className="text-white font-black text-lg tracking-tighter">XS</span>
      </div>
      <div className="flex flex-col">
        <div className="leading-none">
          <span className="text-black dark:text-white font-extrabold text-xl tracking-tight">XTREME </span>
          <span className="text-[#F5A000] font-extrabold text-xl tracking-tight">SCRAPER</span>
        </div>
      </div>
    </div>
  );
}

export function LogoSidebar() {
  return (
    <div className="flex flex-col space-y-1 select-none">
      <div className="flex items-center space-x-3">
        {/* Shield logo */}
        <div className="relative flex items-center justify-center w-10 h-11 bg-black rounded-lg border-2 border-[#F5A000] shadow-[0_0_10px_rgba(245,160,0,0.3)]">
          <div className="absolute -top-1.5 flex space-x-1">
            <div className="w-1.5 h-1.5 bg-[#F5A000] rotate-45 rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#F5A000] rotate-45 rounded-sm"></div>
            <div className="w-1.5 h-1.5 bg-[#F5A000] rotate-45 rounded-sm"></div>
          </div>
          <span className="text-white font-black text-lg tracking-tighter">XS</span>
        </div>
        <div className="leading-none">
          <span className="text-white font-extrabold text-xl tracking-tight">XTREME </span>
          <span className="text-[#F5A000] font-extrabold text-xl tracking-tight font-sans">SCRAPER</span>
        </div>
      </div>
      <span className="text-[10px] tracking-[0.2em] font-black text-[#F5A000] pl-[53px]">FLOORS FOR LIFE.</span>
    </div>
  );
}
