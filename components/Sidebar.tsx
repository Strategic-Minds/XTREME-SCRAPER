'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/2208ed0a5_ChatGPTImageJul14202610_12_57PM4.png' },
  { href: '/dashboard', label: 'Search', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/e0e8bf14e_ChatGPTImageJul14202610_12_57PM5.png' },
  { href: '/leads', label: 'Leads', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/edfa95459_ChatGPTImageJul14202610_12_57PM6.png' },
  { href: '/memory', label: 'Memory', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/f14d37391_ChatGPTImageJul14202610_12_57PM7.png' },
  { href: '/export', label: 'Export', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/92df37ad9_ChatGPTImageJul14202610_12_57PM8.png' },
  { href: '/sources', label: 'Sources', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/50c057436_ChatGPTImageJul14202610_12_57PM9.png' },
  { href: '/settings', label: 'Settings', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/1dc389af0_ChatGPTImageJul14202610_12_57PM10.png' },
];

export default function Sidebar() {
  const pathname = usePathname() || '';

  return (
    <aside className="w-[72px] bg-black flex flex-col items-center py-6 gap-6 min-h-screen shrink-0 border-r border-zinc-900 z-50">
      <Link href="/">
        <img 
          src="https://media.base44.com/images/public/69db047707a15d69135e3de9/396dd42e2_ChatGPTImageJul14202610_12_57PM3.png" 
          className="w-12 h-12 object-contain mb-4 transition-transform hover:scale-110" 
          style={{ mixBlendMode: 'multiply' }}
          alt="XS" 
        />
      </Link>
      <div className="flex-1 flex flex-col gap-5 w-full items-center">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href} className="relative group flex items-center justify-center w-full">
              <Link 
                href={item.href}
                className={'p-2.5 rounded-xl transition-all ' + (
                  isActive 
                    ? 'bg-[#FFBE00] text-black shadow-[0_0_12px_#FFBE00]' 
                    : 'hover:bg-zinc-900 text-[#888] hover:text-white'
                )}
                style={isActive ? { boxShadow: '0 0 12px #FFBE00' } : {}}
              >
                <img 
                  src={item.icon} 
                  className="w-6 h-6 object-contain" 
                  style={{ mixBlendMode: 'multiply', filter: isActive ? 'none' : 'brightness(0.8) invert(1)' }}
                  alt={item.label} 
                />
              </Link>
              
              {/* Tooltip */}
              <div className="absolute left-16 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white font-bold text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-md whitespace-nowrap shadow-2xl z-50 transition-all">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
