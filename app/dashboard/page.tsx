import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import {
  Building2,
  Clock,
  Calendar,
  Layers,
  Settings,
  BarChart3,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Zap,
} from 'lucide-react';

interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  org_id?: string;
}

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  await connectDB();
  const user = await User.findOne({ email: session.user?.email });
  const org = user?.org_id ? await Organization.findById(user.org_id) : null;

  const extUser = session.user as ExtendedUser;

  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-8 lg:p-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full z-10 relative space-y-8">
        {/* Header Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-border relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-primary via-accent to-emerald-500" />
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Workspace Active</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Welcome back, <span className="cyber-gradient-text">{extUser?.name || 'User'}</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {extUser?.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-2xl bg-primary/20 border border-primary/40 text-primary text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary/10">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {user?.role || 'member'}
            </span>
          </div>
        </div>

        {/* Organization Section */}
        {org ? (
          <div className="glass-panel glass-panel-hover rounded-3xl p-6 sm:p-8 border border-border relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Primary Organization
                </p>
                <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">{org.name}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                  blockspace.app/org/{org.slug}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/analytics"
                  className="px-5 py-2.5 cyber-gradient-btn text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
                <Link
                  href="/settings/branding"
                  className="px-5 py-2.5 bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-bold rounded-xl transition flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Subscription Tier</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                {org.plan} Plan
              </span>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center border border-dashed border-border space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-xl font-bold text-foreground">No Organization Configured</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Create or join an enterprise organization to start managing resources, clubs, and live events.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 cyber-gradient-btn text-white text-sm font-bold rounded-xl shadow-xl"
            >
              <Plus className="w-4 h-4" />
              <span>Create Organization</span>
            </Link>
          </div>
        )}

        {/* Quick Nav Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/availability"
            className="group glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-44"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Real-Time</span>
              <h3 className="text-xl font-black text-foreground mt-1">Live Availability</h3>
              <p className="text-xs text-muted-foreground mt-1">Slot locking & status</p>
            </div>
          </Link>

          <Link
            href="/bookings"
            className="group glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-44"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Reservations</span>
              <h3 className="text-xl font-black text-foreground mt-1">Bookings</h3>
              <p className="text-xs text-muted-foreground mt-1">Manage resource slots</p>
            </div>
          </Link>

          <Link
            href="/events"
            className="group glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-44"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Multi-Tenant</span>
              <h3 className="text-xl font-black text-foreground mt-1">Events & Tickets</h3>
              <p className="text-xs text-muted-foreground mt-1">QR tickets & waitlists</p>
            </div>
          </Link>

          <Link
            href="/hierarchy"
            className="group glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-44"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Settings className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Structure</span>
              <h3 className="text-xl font-black text-foreground mt-1">Clubs & Depts</h3>
              <p className="text-xs text-muted-foreground mt-1">Organizational hierarchy</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}