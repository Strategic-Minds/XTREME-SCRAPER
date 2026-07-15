'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Home', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/2208ed0a5_ChatGPTImageJul14202610_12_57PM4.png' },
  { href: '/dashboard', label: 'Search', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/e0e8bf14e_ChatGPTImageJul14202610_12_57PM5.png' },
  { href: '/leads', label: 'Leads', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/edfa95459_ChatGPTImageJul14202610_12_57PM6.png' },
  { href: '/memory', label: 'Memory', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/f14d37391_ChatGPTImageJul14202610_12_57PM7.png' },
  { href: '/export', label: 'Export', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/92df37ad9_ChatGPTImageJul14202610_12_57PM8.png' },
  { href: '/sources', label: 'Sources', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/50c057436_ChatGPTImageJul14202610_12_57PM9.png' },
  { href: '/settings', label: 'Settings', icon: 'https://media.base44.com/images/public/69db047707a15d69135e3de9/1dc389af0_ChatGPTImageJul14202610_12_57PM10.png' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className='w-20 bg-black flex flex-col items-center py-6 gap-6 min-h-screen shrink-0'>
      <Link href='/'>
        <img src='https://media.base44.com/images/public/69db047707a15d69135e3de9/396dd42e2_ChatGPTImageJul14202610_12_57PM3.png' className='w-12 h-12 object-contain mb-4' alt='XS' />
      </Link>
      {navItems.map(item => (
        <Link key={item.href} href={item.href} title={item.label}
          className={`p-2 rounded-xl transition-all ${
            pathname === item.href ? 'bg-[#FFBE00]' : 'hover:bg-zinc-800'
          }`}>
          <img src={item.icon} className='w-7 h-7 object-contain' alt={item.label} />
        </Link>
      ))}
    </aside>
  )
}
