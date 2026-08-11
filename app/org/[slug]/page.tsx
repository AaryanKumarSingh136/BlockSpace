'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Users, Building, Search, ExternalLink, ShieldCheck } from 'lucide-react';

export default function PublicOrgPage() {
  const params = useParams();
  const orgSlug = params?.slug as string;

  const [org, setOrg] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (orgSlug) {
      fetchPublicOrgData();
    }
  }, [orgSlug]);

  const fetchPublicOrgData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch org details & public events
      const res = await fetch(`/api/public/org/${orgSlug}`);
      if (!res.ok) {
        // Fallback: fetch directly from events by org slug or list public events
        const fallbackRes = await fetch(`/api/public/events/search?org=${orgSlug}`);
        if (!fallbackRes.ok) {
          throw new Error('Organization not found');
        }
        const data = await fallbackRes.json();
        setOrg(data.organization);
        setEvents(data.events || []);
      } else {
        const data = await res.json();
        setOrg(data.organization);
        setEvents(data.events || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const accentColor = org?.accent_color || '#6366F1';

  const filteredEvents = events.filter(
    (e) =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="min-h-screen bg-gray-950 text-white"
      style={{ '--accent-color': accentColor } as React.CSSProperties}
    >
      {/* Public Header */}
      <header className="border-b border-gray-800 bg-gray-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org?.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="w-9 h-9 rounded-lg object-cover border border-gray-700"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-lg shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {org?.name ? org.name.charAt(0).toUpperCase() : 'B'}
              </div>
            )}
            <span className="font-extrabold text-xl tracking-tight">{org?.name || 'Organization'}</span>
          </div>

          <Link
            href="/sign-in"
            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-md font-medium transition"
          >
            Member Login
          </Link>
        </div>
      </header>

      {/* Hero Section with Custom Branding */}
      <section
        className="relative py-16 px-4 border-b border-gray-800 overflow-hidden"
        style={{
          background: `radial-gradient(circle at top center, ${accentColor}25 0%, rgba(3,7,18,0.95) 70%)`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {org?.logo_url && (
            <img
              src={org.logo_url}
              alt={org.name}
              className="w-20 h-20 rounded-2xl mx-auto mb-4 border-2 border-white/20 shadow-2xl object-cover"
            />
          )}

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
            Welcome to {org?.name || 'Blockspace'}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Explore public events, register for upcoming activities, and engage with our vibrant community.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search public events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900/90 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 text-sm shadow-xl transition"
              style={{ focusRingColor: accentColor } as any}
            />
          </div>
        </div>
      </section>

      {/* Events Listing */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6" style={{ color: accentColor }} />
              Public Events
            </h2>
            <p className="text-gray-400 text-xs mt-1">Upcoming events open for registration</p>
          </div>
          <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full font-medium border border-gray-700">
            {filteredEvents.length} Event{filteredEvents.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Loading public events...
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-xl text-center">
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
            No public events found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const attendeeCount = event.attendee_list ? event.attendee_list.length : 0;
              const isFull = attendeeCount >= event.capacity;
              const eventSlug = event.slug || event._id;

              return (
                <div
                  key={event._id}
                  className="bg-gray-900/80 border border-gray-800 hover:border-gray-700 rounded-2xl p-6 transition flex flex-col justify-between shadow-lg hover:shadow-2xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {event.club_id?.name ? (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {event.club_id.name}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-400">
                          General Event
                        </span>
                      )}

                      {isFull ? (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Waitlist Open
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Seats Open
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{event.title}</h3>
                    <p className="text-gray-400 text-xs mb-4 line-clamp-2">{event.description || 'No description provided.'}</p>

                    <div className="space-y-2 text-xs text-gray-300 mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>
                          {new Date(event.start_time).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(event.start_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>
                          {attendeeCount} / {event.capacity} Attendees
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/org/${orgSlug}/events/${eventSlug}`}
                    className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-md"
                    style={{ backgroundColor: accentColor }}
                  >
                    {isFull ? 'Join Waitlist' : 'Register Now'}
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
