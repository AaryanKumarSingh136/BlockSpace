'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Booking {
  _id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  resource_id: { name: string; type: string };
  user_id: { name: string; email: string };
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings');
    const data = await res.json();
    setBookings(data.bookings || []);
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setLoading(true);
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      fetchBookings();
    }
    setLoading(false);
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'text-emerald-600 dark:text-emerald-400';
    if (status === 'pending') return 'text-amber-600 dark:text-amber-400';
    if (status === 'rejected') return 'text-destructive';
    return 'text-muted-foreground';
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const otherBookings = bookings.filter(b => b.status !== 'pending');

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage bookings and approvals</p>

        {/* Pending Bookings */}
        <h2 className="text-xl font-semibold mb-4 text-amber-600 dark:text-amber-400">
          Pending Approvals ({pendingBookings.length})
        </h2>
        <div className="space-y-4 mb-10">
          {pendingBookings.length === 0 ? (
            <p className="text-muted-foreground">No pending bookings.</p>
          ) : (
            pendingBookings.map((b) => (
              <div key={b._id} className="bg-card border border-amber-500/30 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-card-foreground">{b.title}</h3>
                  <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">Pending</span>
                </div>
                <p className="text-muted-foreground text-sm">Resource: {b.resource_id?.name} ({b.resource_id?.type})</p>
                <p className="text-muted-foreground text-sm">Requested by: {b.user_id?.name} ({b.user_id?.email})</p>
                <p className="text-muted-foreground text-sm mb-4">
                  {new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleString()}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => updateStatus(b._id, 'approved')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={loading}
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => updateStatus(b._id, 'rejected')}
                    className="bg-destructive hover:bg-destructive/90 text-white"
                    disabled={loading}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* All Other Bookings */}
        <h2 className="text-xl font-semibold mb-4 text-foreground">All Bookings</h2>
        <div className="space-y-3">
          {otherBookings.length === 0 ? (
            <p className="text-muted-foreground">No other bookings.</p>
          ) : (
            otherBookings.map((b) => (
              <div key={b._id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-card-foreground">{b.title}</h3>
                  <span className={`text-sm capitalize font-medium ${statusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">Resource: {b.resource_id?.name}</p>
                <p className="text-muted-foreground text-sm">By: {b.user_id?.name}</p>
                <p className="text-muted-foreground text-sm">
                  {new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}