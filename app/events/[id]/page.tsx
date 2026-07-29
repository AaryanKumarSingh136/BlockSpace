'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EventDetails {
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

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      const data = await res.json();
      if (res.ok) {
        setEvent(data.event);
        setIsRegistered(data.isRegistered);
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    setRegisterLoading(true);
    setMessage(null);

    const res = await fetch(`/api/events/${id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (res.ok) {
      setMessage({ type: 'success', text: 'Registration successful! Redirecting to your QR ticket...' });
      setIsRegistered(true);
      setTimeout(() => router.push(`/events/${id}/ticket`), 1500);
    } else {
      setMessage({ type: 'error', text: data.message });
    }
    setRegisterLoading(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400">Loading event details...</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 text-white p-4">
        <Card className="bg-gray-900 border-gray-800 text-white p-6 max-w-md w-full text-center">
          <p className="text-red-400 mb-4">Event not found.</p>
          <Link href="/events">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Back to Events</Button>
          </Link>
        </Card>
      </main>
    );
  }

  const registeredCount = event.attendee_list?.length || 0;
  const isFull = registeredCount >= event.capacity;

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">

        <Link href="/events" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
          ← Back to Events
        </Link>

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

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="space-y-3 border-b border-gray-800 pb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded border border-indigo-800">
                {event.club_id?.name || 'Organization Event'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded font-semibold ${isFull ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-green-950 text-green-400 border border-green-800'}`}>
                {registeredCount} / {event.capacity} Registered
              </span>
            </div>

            <CardTitle className="text-3xl font-bold">{event.title}</CardTitle>
            {event.description && (
              <CardDescription className="text-gray-300 text-sm leading-relaxed">
                {event.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950/80 p-4 rounded-lg border border-gray-800 text-sm">
              <div>
                <span className="text-gray-400 text-xs block">Start Time</span>
                <span className="font-semibold">{new Date(event.start_time).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">End Time</span>
                <span className="font-semibold">{new Date(event.end_time).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Organizer</span>
                <span className="font-semibold">{event.organizer_id?.name || 'Org Admin'}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Entry Type</span>
                <span className="font-semibold text-emerald-400">JWT QR Code Ticket</span>
              </div>
            </div>

            {/* Registration Actions */}
            <div className="pt-2">
              {isRegistered ? (
                <div className="space-y-3 bg-indigo-950/40 border border-indigo-800/80 p-5 rounded-xl text-center">
                  <p className="text-emerald-400 font-bold text-sm">✅ You are registered for this event!</p>
                  <Link href={`/events/${event._id}/ticket`}>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold mt-2">
                      🎟️ View / Present Your QR Ticket
                    </Button>
                  </Link>
                </div>
              ) : isFull ? (
                <Button disabled className="w-full bg-gray-800 text-gray-500 font-semibold cursor-not-allowed">
                  Event Full (Capacity Reached)
                </Button>
              ) : (
                <Button
                  onClick={handleRegister}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold py-6 text-base shadow-lg shadow-indigo-950"
                  disabled={registerLoading}
                >
                  {registerLoading ? 'Registering...' : 'Register Now & Claim QR Ticket'}
                </Button>
              )}
            </div>

          </CardContent>
        </Card>

      </div>
    </main>
  );
}
