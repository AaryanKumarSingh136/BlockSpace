'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleJoin = async () => {
    if (!token) {
      setError('Invalid invite link');
      return;
    }

    setLoading(true);
    setError('');

    const res = await fetch('/api/organizations/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Organization</CardTitle>
          <CardDescription className="text-gray-400">
            You have been invited to join an organization on Blockspace
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {success ? (
            <p className="text-green-400">Successfully joined! Redirecting to dashboard...</p>
          ) : (
            <>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button
                onClick={handleJoin}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Accept Invite'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}