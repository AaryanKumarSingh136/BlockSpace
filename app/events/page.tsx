'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  capacity: number;
  attendee_list: any[];
  organizer_id?: { name: string; email: string };
  club_id?: { name: string };
  dept_id?: { name: string };
}

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    capacity: '50',
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: 'Event created successfully!' });
      setForm({ title: '', description: '', start_time: '', end_time: '', capacity: '50' });
      setShowModal(false);
      fetchEvents();
    } else {
      setMessage({ type: 'error', text: data.message });
    }
    setFormLoading(false);
  };

  const isManagerOrAdmin = ['manager', 'orgAdmin', 'superAdmin'].includes(session?.user?.role || '');

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Events & QR Ticketing</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse events, register for QR tickets, and validate door access
            </p>
          </div>

          {isManagerOrAdmin && (
            <Button
              onClick={() => setShowModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            >
              + Create New Event
            </Button>
          )}
        </div>

        {/* Global Alert Notification */}
        {message && (
          <div
            className={`p-4 rounded-lg border text-sm font-medium flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <Card className="bg-card border-border text-muted-foreground p-8 text-center">
            No upcoming events yet. {isManagerOrAdmin ? 'Click "+ Create New Event" above to create one!' : ''}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const registeredCount = evt.attendee_list?.length || 0;
              const isFull = registeredCount >= evt.capacity;

              return (
                <Card key={evt._id} className="bg-card border-border text-card-foreground flex flex-col justify-between hover:border-ring transition">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                        {evt.club_id?.name || 'Org Event'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isFull ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'}`}>
                        {registeredCount} / {evt.capacity} Seats
                      </span>
                    </div>

                    <CardTitle className="text-xl font-bold text-card-foreground">{evt.title}</CardTitle>
                    {evt.description && (
                      <CardDescription className="text-muted-foreground text-xs line-clamp-2 mt-1">
                        {evt.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/60 p-3 rounded border border-border font-mono">
                      <div>
                        Start: {new Date(evt.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <div>
                        End: {new Date(evt.end_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      {evt.organizer_id && (
                        <div className="text-primary font-sans mt-1">
                          Organizer: {evt.organizer_id.name}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link href={`/events/${evt._id}`}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold">
                          View Details & Register
                        </Button>
                      </Link>

                      {isManagerOrAdmin && (
                        <Link href={`/events/${evt._id}/scanner`}>
                          <Button variant="outline" className="w-full border-border text-foreground hover:bg-muted text-xs font-semibold">
                            📷 Door Scanner View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal: Create Event */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border text-card-foreground rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-foreground">Create Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <Label>Event Title</Label>
                <Input
                  placeholder="e.g. Annual Tech Symposium 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-muted border-border text-foreground mt-1"
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Event agenda & details"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-muted border-border text-foreground mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="bg-muted border-border text-foreground text-xs mt-1"
                    required
                  />
                </div>

                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="bg-muted border-border text-foreground text-xs mt-1"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Capacity (Max Attendees)</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  className="bg-muted border-border text-foreground mt-1"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
