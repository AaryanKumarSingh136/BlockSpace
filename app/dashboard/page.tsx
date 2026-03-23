import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

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

  const user = session.user as ExtendedUser;

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-8">Welcome back, {user?.name}!</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-1">Your Role</h2>
            <p className="text-indigo-400 capitalize">{user?.role || 'member'}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-1">Email</h2>
            <p className="text-gray-400">{user?.email}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-1">Organization</h2>
            <p className="text-gray-400">Not assigned yet</p>
          </div>
        </div>
      </div>
    </main>
  );
}