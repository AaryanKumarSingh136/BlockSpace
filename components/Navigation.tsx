'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu,
  X,
  LogOut,
  Sparkles,
  LayoutDashboard,
  Calendar,
  Layers,
  Clock,
  Settings,
  BarChart3,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session) return null;

  const isAdmin = ['orgAdmin', 'superAdmin'].includes(session.user?.role || '');

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/availability', label: 'Live Availability', icon: Clock, isLive: true },
    { href: '/events', label: 'Events & Tickets', icon: Calendar },
    { href: '/resources', label: 'Resources', icon: Layers },
    { href: '/bookings', label: 'Bookings', icon: Clock },
    { href: '/hierarchy', label: 'Hierarchy & Clubs', icon: Settings },
    ...(isAdmin
      ? [
          { href: '/analytics', label: 'Analytics', icon: BarChart3 },
          { href: '/settings/branding', label: 'Branding', icon: Sparkles },
          { href: '/admin', label: 'Admin Panel', icon: ShieldAlert },
        ]
      : []),
  ];

  return (
    <header className="border-b border-white/10 bg-[#07090e]/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Desktop Links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#07090e] rounded-[11px] flex items-center justify-center">
                <span className="cyber-gradient-text text-lg font-black tracking-wider">B</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors">
                Blockspace
              </span>
              <span className="text-[10px] font-bold text-indigo-400/80 tracking-widest uppercase">
                Enterprise
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 relative ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                  {link.label}
                  {link.isLive && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-xs pr-2">
            <span className="text-white font-semibold tracking-tight">{session.user?.name || session.user?.email}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {session.user?.role || 'member'}
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className="hidden sm:flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-3.5 py-2 rounded-xl font-medium transition duration-200"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-400" />
            Sign Out
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-indigo-400" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bg-[#07090e]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl z-50 transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* User Mobile Card */}
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">{session.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{session.user?.email}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {session.user?.role || 'member'}
              </span>
            </div>

            {/* Nav Links Grid */}
            <div className="space-y-1 pt-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                        : 'text-gray-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`} />
                      <span>{link.label}</span>
                      {link.isLive && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                          LIVE
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </Link>
                );
              })}
            </div>

            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/sign-in' });
                }}
                className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out Account
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
