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
  capacity?: number;
  current_status: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState({ name: '', type: 'room', capacity: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchResources = async () => {
    const res = await fetch('/api/resources');
    const data = await res.json();
    setResources(data.resources || []);
  };

  useEffect(() => { fetchResources(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message);
      setLoading(false);
      return;
    }

    setForm({ name: '', type: 'room', capacity: '' });
    fetchResources();
    setLoading(false);
  };

  const statusColor = (status: string) => {
    if (status === 'available') return 'text-green-400';
    if (status === 'occupied') return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8">Resources</h1>
        <Card className="bg-gray-900 border-gray-800 text-white mb-8">
          <CardHeader>
            <CardTitle>Add New Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Lab 101"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
                  >
                    <option value="room">Room</option>
                    <option value="desk">Desk</option>
                    <option value="equipment">Equipment</option>
                    <option value="court">Court</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Capacity (optional)</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? 'Creating...' : 'Add Resource'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.length === 0 ? (
            <p className="text-gray-400">No resources yet. Add one above.</p>
          ) : (
            resources.map((r) => (
              <div key={r._id} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">{r.name}</h2>
                  <span className={`text-sm capitalize font-medium ${statusColor(r.current_status)}`}>
                    {r.current_status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm capitalize">Type: {r.type}</p>
                {r.capacity && <p className="text-gray-400 text-sm">Capacity: {r.capacity}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}