import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoSidebar } from './Logo';
import { 
  Home, 
  Search, 
  List, 
  Star, 
  Briefcase, 
  Download, 
  Puzzle, 
  Settings, 
  User, 
  Clock, 
  HelpCircle 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname() || '';

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard' },
    { label: 'New Scrape', icon: Search, href: '/' },
    { label: 'Leads', icon: List, href: '/dashboard' },
    { label: 'Saved Leads', icon: Star, href: '/memory' },
    { label: 'Scrape Jobs', icon: Briefcase, href: '/dashboard' },
    { label: 'Data Exports', icon: Download, href: '/memory' },
    { label: 'Integrations', icon: Puzzle, href: '/dashboard' },
    { label: 'Settings', icon: Settings, href: '/dashboard' },
    { label: 'Users', icon: User, href: '/dashboard' },
    { label: 'Activity Log', icon: Clock, href: '/memory' },
    { label: 'Help & Support', icon: HelpCircle, href: '/dashboard' },
  ];

  return (
    <aside className="w-64 bg-[#111111] text-white flex flex-col justify-between p-6 border-r border-gray-800 min-h-screen">
      {/* Brand & Logo */}
      <div className="flex flex-col space-y-8">
        <LogoSidebar />
        
        {/* Navigation Menu */}
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.label} 
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
                  isActive 
                    ? 'bg-[#F5A000] text-black shadow-lg shadow-[#F5A000]/20' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-black' : 'text-[#F5A000]'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin User Profile */}
      <div className="flex items-center space-x-3 pt-6 border-t border-gray-800 mt-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F5A000] to-yellow-600 flex items-center justify-center font-black text-black">
          AU
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-extrabold text-white leading-tight">Admin User</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Administrator</span>
        </div>
      </div>
    </aside>
  );
}
