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
import ThemeToggle from './ThemeToggle';

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
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Desktop Links */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-105">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary-foreground/25">
                <span className="text-lg font-black tracking-wider text-primary-foreground">B</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black leading-none tracking-tight text-foreground transition-colors group-hover:text-primary">
                Blockspace
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
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
                      ? 'border border-primary/30 bg-primary/10 text-primary shadow-sm'
                      : 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
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
            <span className="font-semibold tracking-tight text-foreground">{session.user?.name || session.user?.email}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {session.user?.role || 'member'}
            </span>
          </div>

          <ThemeToggle />

          <button
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3.5 py-2 text-xs font-medium text-muted-foreground transition duration-200 hover:bg-muted hover:text-foreground sm:flex"
          >
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            Sign Out
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="rounded-lg border border-border bg-muted/60 p-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-50 animate-in fade-in slide-in-from-top-4 border-b border-border bg-background/95 shadow-2xl backdrop-blur-2xl transition-all lg:hidden">
          <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* User Mobile Card */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight text-foreground">{session.user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                </div>
              </div>
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase text-primary">
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
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{link.label}</span>
                      {link.isLive && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded-full border border-emerald-500/30">
                          LIVE
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>

            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/sign-in' });
                }}
                className="w-full py-3 px-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive font-bold text-sm flex items-center justify-center gap-2 transition duration-200"
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
