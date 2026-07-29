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
    <main className="flex min-h-screen flex-col bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events & QR Ticketing</h1>
            <p className="text-gray-400 text-sm mt-1">
              Browse events, register for QR tickets, and validate door access
            </p>
          </div>

          {isManagerOrAdmin && (
            <Button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 font-semibold"
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
                ? 'bg-green-950/70 border-green-800 text-green-300'
                : 'bg-red-950/70 border-red-800 text-red-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800 text-gray-400 p-8 text-center">
            No upcoming events yet. {isManagerOrAdmin ? 'Click "+ Create New Event" above to create one!' : ''}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => {
              const registeredCount = evt.attendee_list?.length || 0;
              const isFull = registeredCount >= evt.capacity;

              return (
                <Card key={evt._id} className="bg-gray-900 border-gray-800 text-white flex flex-col justify-between hover:border-gray-700 transition">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800">
                        {evt.club_id?.name || 'Org Event'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isFull ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-green-950 text-green-400 border border-green-800'}`}>
                        {registeredCount} / {evt.capacity} Seats
                      </span>
                    </div>

                    <CardTitle className="text-xl font-bold">{evt.title}</CardTitle>
                    {evt.description && (
                      <CardDescription className="text-gray-400 text-xs line-clamp-2 mt-1">
                        {evt.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="text-xs text-gray-400 space-y-1 bg-gray-950/60 p-3 rounded border border-gray-800 font-mono">
                      <div>
                        Start: {new Date(evt.start_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      <div>
                        End: {new Date(evt.end_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                      {evt.organizer_id && (
                        <div className="text-indigo-400 font-sans mt-1">
                          Organizer: {evt.organizer_id.name}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link href={`/events/${evt._id}`}>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold">
                          View Details & Register
                        </Button>
                      </Link>

                      {isManagerOrAdmin && (
                        <Link href={`/events/${evt._id}/scanner`}>
                          <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 text-xs font-semibold">
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-xl font-bold">Create Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <Label>Event Title</Label>
                <Input
                  placeholder="e.g. Annual Tech Symposium 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  required
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Event agenda & details"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white text-xs mt-1"
                    required
                  />
                </div>

                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white text-xs mt-1"
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
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-gray-700 text-gray-300"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={formLoading}>
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
