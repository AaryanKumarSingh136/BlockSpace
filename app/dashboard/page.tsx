import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';

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
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2">Welcome back</h1>
            <p className="text-lg text-gray-400">{extUser?.name} • {extUser?.email}</p>
          </div>
          <div className="mt-6 md:mt-0 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-sm font-bold capitalize shadow-lg">
            {user?.role || 'member'}
          </div>
        </div>

        {/* Organization Card */}
        {org ? (
          <div className="mb-10 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-indigo-300 text-sm font-semibold mb-2">Your Organization</p>
                <h2 className="text-3xl font-black mb-2">{org.name}</h2>
                <p className="text-gray-400 text-sm">blockspace.app/org/{org.slug}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/analytics"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition shadow-lg"
                >
                  Analytics
                </Link>
                <Link
                  href="/settings/branding"
                  className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition"
                >
                  Settings
                </Link>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-indigo-500/20">
              <p className="text-gray-300 text-sm font-medium">Plan: <span className="text-indigo-400 font-bold capitalize">{org.plan}</span></p>
            </div>
          </div>
        ) : (
          <div className="mb-10 bg-gray-900/50 border border-dashed border-gray-700 rounded-2xl p-10 text-center">
            <div className="mb-4">
              <div className="text-5xl mb-2">🏢</div>
            </div>
            <p className="text-gray-300 text-lg font-semibold mb-2">No organization yet</p>
            <p className="text-gray-400 mb-6">Create or join an organization to start managing resources and events</p>
            <Link
              href="/onboarding"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-xl font-bold transition shadow-lg"
            >
              Create Organization
            </Link>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/availability" className="group bg-gray-900/60 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 transition duration-200 hover:shadow-lg hover:shadow-indigo-500/20">
            <p className="text-gray-400 text-sm font-semibold mb-2">Availability</p>
            <p className="text-2xl font-black">Resources</p>
            <p className="text-xs text-gray-500 mt-2">View live resource status</p>
          </Link>
          
          <Link href="/bookings" className="group bg-gray-900/60 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 transition duration-200 hover:shadow-lg hover:shadow-indigo-500/20">
            <p className="text-gray-400 text-sm font-semibold mb-2">Bookings</p>
            <p className="text-2xl font-black">Reservations</p>
            <p className="text-xs text-gray-500 mt-2">Manage your bookings</p>
          </Link>
          
          <Link href="/events" className="group bg-gray-900/60 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 transition duration-200 hover:shadow-lg hover:shadow-indigo-500/20">
            <p className="text-gray-400 text-sm font-semibold mb-2">Events</p>
            <p className="text-2xl font-black">Create & Manage</p>
            <p className="text-xs text-gray-500 mt-2">Organize your events</p>
          </Link>
          
          <Link href="/hierarchy" className="group bg-gray-900/60 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-6 transition duration-200 hover:shadow-lg hover:shadow-indigo-500/20">
            <p className="text-gray-400 text-sm font-semibold mb-2">Structure</p>
            <p className="text-2xl font-black">Departments</p>
            <p className="text-xs text-gray-500 mt-2">Organize your hierarchy</p>
          </Link>
        </div>
      </div>
    </main>
  );
}