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
    <main className="flex min-h-screen flex-col bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {extUser?.name}!</p>
          </div>
          <div className="bg-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold capitalize">
            {user?.role || 'member'}
          </div>
        </div>

        {/* Org Card */}
        {org ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Organization</p>
                <h2 className="text-xl font-bold">{org.name}</h2>
                <p className="text-gray-400 text-sm mt-1">blockspace.app/org/{org.slug}</p>
              </div>
              <span className="bg-gray-800 px-3 py-1 rounded-full text-xs text-indigo-400 capitalize">
                {org.plan} plan
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-dashed border-gray-700 rounded-lg p-6 mb-6 text-center">
            <p className="text-gray-400 mb-4">You are not part of any organization yet.</p>
            <Link
              href="/onboarding"
              className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded-lg text-sm font-semibold transition"
            >
              Create Organization
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-gray-400 text-sm mb-1">Email</h2>
            <p className="font-semibold">{extUser?.email}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-gray-400 text-sm mb-1">Role</h2>
            <p className="font-semibold capitalize text-indigo-400">{user?.role || 'member'}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-gray-400 text-sm mb-1">Plan</h2>
            <p className="font-semibold capitalize">{org?.plan || 'No org'}</p>
          </div>
        </div>

      </div>
    </main>
  );
}