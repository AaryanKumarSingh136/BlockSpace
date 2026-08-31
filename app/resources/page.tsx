'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Club {
  _id: string;
  name: string;
}

interface Department {
  _id: string;
  name: string;
  club_id: { _id: string; name: string } | string;
}

interface Resource {
  _id: string;
  name: string;
  type: string;
  capacity?: number;
  current_status: string;
  club_id?: { _id: string; name: string };
  dept_id?: { _id: string; name: string };
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [form, setForm] = useState({
    name: '',
    type: 'room',
    capacity: '',
    club_id: '',
    dept_id: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchResources = async () => {
    const res = await fetch('/api/resources');
    const data = await res.json();
    setResources(data.resources || []);
  };

  const fetchHierarchy = async () => {
    try {
      const [resClubs, resDepts] = await Promise.all([
        fetch('/api/clubs'),
        fetch('/api/departments'),
      ]);
      if (resClubs.ok) {
        const data = await resClubs.json();
        setClubs(data.clubs || []);
      }
      if (resDepts.ok) {
        const data = await resDepts.json();
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error('Error fetching hierarchy for resources:', err);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchHierarchy();
  }, []);

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
        club_id: form.club_id || undefined,
        dept_id: form.dept_id || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message);
      setLoading(false);
      return;
    }

    setForm({ name: '', type: 'room', capacity: '', club_id: '', dept_id: '' });
    fetchResources();
    setLoading(false);
  };

  const statusColor = (status: string) => {
    if (status === 'available') return 'text-emerald-600 dark:text-emerald-400';
    if (status === 'occupied') return 'text-destructive';
    return 'text-amber-600 dark:text-amber-400';
  };

  const availableDepts = departments.filter((d) => {
    if (!form.club_id) return true;
    return typeof d.club_id === 'object' ? d.club_id._id === form.club_id : d.club_id === form.club_id;
  });

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Resource Directory</h1>

        {/* Add Resource Card */}
        <Card className="bg-card border-border text-card-foreground mb-8">
          <CardHeader>
            <CardTitle className="text-card-foreground">Add New Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Lab 101 / Projector A"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-muted border-border text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm"
                  >
                    <option value="room" className="bg-card text-card-foreground">Room</option>
                    <option value="desk" className="bg-card text-card-foreground">Desk</option>
                    <option value="equipment" className="bg-card text-card-foreground">Equipment</option>
                    <option value="court" className="bg-card text-card-foreground">Court</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Capacity (optional)</Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
              </div>

              {/* Multi-Level Hierarchy Scope Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label>Scope to Club (Optional)</Label>
                  <select
                    value={form.club_id}
                    onChange={(e) => setForm({ ...form, club_id: e.target.value, dept_id: '' })}
                    className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm"
                  >
                    <option value="" className="bg-card text-card-foreground">Org-Wide Resource</option>
                    {clubs.map((c) => (
                      <option key={c._id} value={c._id} className="bg-card text-card-foreground">
                        Club: {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Scope to Department (Optional)</Label>
                  <select
                    value={form.dept_id}
                    onChange={(e) => setForm({ ...form, dept_id: e.target.value })}
                    className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm"
                  >
                    <option value="" className="bg-card text-card-foreground">All / Club-Wide</option>
                    {availableDepts.map((d) => (
                      <option key={d._id} value={d._id} className="bg-card text-card-foreground">
                        Dept: {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" disabled={loading}>
                {loading ? 'Creating...' : 'Add Resource'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.length === 0 ? (
            <p className="text-muted-foreground">No resources available in your organization yet.</p>
          ) : (
            resources.map((r) => (
              <div key={r._id} className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold text-card-foreground">{r.name}</h2>
                    <span className={`text-sm capitalize font-medium ${statusColor(r.current_status)}`}>
                      {r.current_status}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-sm capitalize mb-3">Type: {r.type} {r.capacity ? `• Capacity: ${r.capacity}` : ''}</p>
                </div>

                {/* Scoping Badges */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  {r.club_id?.name ? (
                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded font-medium">
                      Club: {r.club_id.name}
                    </span>
                  ) : (
                    <span className="text-xs bg-muted text-muted-foreground border border-border px-2.5 py-0.5 rounded font-medium">
                      Scope: Org-Wide
                    </span>
                  )}

                  {r.dept_id?.name && (
                    <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded font-medium">
                      Dept: {r.dept_id.name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}