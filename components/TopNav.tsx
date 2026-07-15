'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function TopNav() {
  const pathname = usePathname() || '';

  return (
    <nav className="w-full bg-[#111] border-b border-zinc-800 py-4 px-6 md:px-12 flex items-center justify-between z-40 relative">
      <Link href="/">
        <Logo />
      </Link>
      
      <div className="flex items-center space-x-8">
        <Link 
          href="/" 
          className={'text-sm font-black tracking-widest hover:text-[#FFBE00] transition-colors ' + (
            pathname === '/' ? 'text-[#FFBE00] border-b-2 border-[#FFBE00] pb-1' : 'text-white'
          )}
        >
          HOME
        </Link>
        <Link 
          href="/dashboard" 
          className={'text-sm font-black tracking-widest hover:text-[#FFBE00] transition-colors ' + (
            pathname === '/dashboard' ? 'text-[#FFBE00] border-b-2 border-[#FFBE00] pb-1' : 'text-white'
          )}
        >
          DASHBOARD
        </Link>
        <Link 
          href="/memory" 
          className={'text-sm font-black tracking-widest hover:text-[#FFBE00] transition-colors ' + (
            pathname === '/memory' ? 'text-[#FFBE00] border-b-2 border-[#FFBE00] pb-1' : 'text-white'
          )}
        >
          SAVED
        </Link>
        <Link href="/auth">
          <button className="bg-[#FFBE00] text-black font-black text-xs tracking-widest px-6 py-2.5 rounded hover:brightness-110 transition-all uppercase shadow-md">
            SIGN IN
          </button>
        </Link>
      </div>
    </nav>
  );
}
