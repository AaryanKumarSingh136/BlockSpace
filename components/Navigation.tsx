'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/availability', label: 'Live Availability', isLive: true },
    { href: '/events', label: 'Events & Tickets' },
    { href: '/resources', label: 'Resources' },
    { href: '/bookings', label: 'Bookings' },
    { href: '/hierarchy', label: 'Hierarchy & Clubs' },
    { href: '/admin', label: 'Admin Panel' },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded text-sm font-extrabold">B</span>
            Blockspace
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  {link.isLive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-xs">
            <span className="text-white font-medium">{session.user?.name || session.user?.email}</span>
            <span className="text-indigo-400 capitalize font-semibold">{session.user?.role || 'member'}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md font-medium transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
