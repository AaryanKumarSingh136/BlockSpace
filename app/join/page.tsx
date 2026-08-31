'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function JoinForm() {
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
    <CardContent className="text-center space-y-4">
      {success ? (
        <p className="text-emerald-600 dark:text-emerald-400 font-medium">Successfully joined! Redirecting to dashboard...</p>
      ) : (
        <>
          {error && <p className="text-destructive text-sm font-medium">{error}</p>}
          <Button
            onClick={handleJoin}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? 'Joining...' : 'Accept Invite'}
          </Button>
        </>
      )}
    </CardContent>
  );
}

export default function JoinPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
      <Card className="w-full max-w-md bg-card border-border text-card-foreground shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-card-foreground">Join Organization</CardTitle>
          <CardDescription className="text-muted-foreground">
            You have been invited to join an organization on Blockspace
          </CardDescription>
        </CardHeader>
        <Suspense fallback={<CardContent className="text-center text-muted-foreground">Loading invite...</CardContent>}>
          <JoinForm />
        </Suspense>
      </Card>
    </main>
  );
}