'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function TopNav() {
  const pathname = usePathname() || '';

  return (
    <nav className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex items-center justify-between z-40 relative">
      <Link href="/">
        <Logo />
      </Link>
      
      <div className="flex items-center space-x-8">
        <Link 
          href="/"
          className={`text-sm font-bold tracking-wider hover:text-[#FFBE00] transition-colors ${
            pathname === '/' ? 'text-[#FFBE00]' : 'text-black'
          }`}
        >
          HOME
        </Link>
        <Link 
          href="/memory"
          className={`text-sm font-bold tracking-wider hover:text-[#FFBE00] transition-colors ${
            pathname === '/memory' ? 'text-[#FFBE00]' : 'text-black'
          }`}
        >
          SAVED
        </Link>
        <Link href="/auth">
          <button className="bg-[#FFBE00] text-black font-extrabold text-xs tracking-widest px-6 py-2.5 rounded hover:bg-amber-500 transition-all uppercase shadow-sm">
            SIGN IN
          </button>
        </Link>
      </div>
    </nav>
  );
}
