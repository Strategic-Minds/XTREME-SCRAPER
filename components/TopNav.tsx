'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

export default function TopNav() {
  const pathname = usePathname() || '';

  return (
    <nav className="relative z-40 flex w-full max-w-full items-center justify-between gap-3 overflow-hidden border-b border-gray-100 bg-white px-4 py-4 sm:px-6 md:px-12">
      <Link href="/" className="min-w-0 shrink">
        <Logo />
      </Link>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5 md:gap-8">
        <Link
          href="/"
          className={`hidden text-sm font-bold tracking-wider transition-colors hover:text-[#FFBE00] sm:block ${
            pathname === '/' ? 'text-[#FFBE00]' : 'text-black'
          }`}
        >
          HOME
        </Link>
        <Link
          href="/memory"
          className={`hidden text-sm font-bold tracking-wider transition-colors hover:text-[#FFBE00] sm:block ${
            pathname === '/memory' ? 'text-[#FFBE00]' : 'text-black'
          }`}
        >
          SAVED
        </Link>
        <Link href="/auth">
          <button className="whitespace-nowrap rounded bg-[#FFBE00] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-black shadow-sm transition-all hover:bg-amber-500 sm:px-6 sm:text-xs">
            SIGN IN
          </button>
        </Link>
      </div>
    </nav>
  );
}
