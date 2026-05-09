'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Resource {
  _id: string;
  name: string;
  type: string;
}

interface Booking {
  _id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  resource_id: { name: string; type: string };
  user_id: { name: string; email: string };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState({ resource_id: '', title: '', start_time: '', end_time: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [bookingsRes, resourcesRes] = await Promise.all([
      fetch('/api/bookings'),
      fetch('/api/resources'),
    ]);
    const bookingsData = await bookingsRes.json();
    const resourcesData = await resourcesRes.json();
    setBookings(bookingsData.bookings || []);
    setResources(resourcesData.resources || []);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message);
      setLoading(false);
      return;
    }

    setSuccess('Booking created successfully!');
    setForm({ resource_id: '', title: '', start_time: '', end_time: '' });
    fetchData();
    setLoading(false);
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'text-green-400';
    if (status === 'pending') return 'text-yellow-400';
    if (status === 'rejected') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8">Bookings</h1>

        {/* Create Booking Form */}
        <Card className="bg-gray-900 border-gray-800 text-white mb-8">
          <CardHeader>
            <CardTitle>New Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Team Meeting"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Resource</Label>
                <select
                  value={form.resource_id}
                  onChange={(e) => setForm({ ...form, resource_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a resource</option>
                  {resources.map((r) => (
                    <option key={r._id} value={r._id}>{r.name} ({r.type})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? 'Booking...' : 'Create Booking'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <p className="text-gray-400">No bookings yet.</p>
          ) : (
            bookings.map((b) => (
              <div key={b._id} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">{b.title}</h2>
                  <span className={`text-sm capitalize font-medium ${statusColor(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">Resource: {b.resource_id?.name} ({b.resource_id?.type})</p>
                <p className="text-gray-400 text-sm">By: {b.user_id?.name}</p>
                <p className="text-gray-400 text-sm">
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