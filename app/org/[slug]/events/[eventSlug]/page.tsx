'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Users, ShieldCheck, ArrowLeft, Ticket as TicketIcon, CheckCircle2, UserCheck, AlertCircle, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';

export default function PublicEventPage() {
  const params = useParams();
  const orgSlug = params?.slug as string;
  const eventSlug = params?.eventSlug as string;

  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Form State
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Issued Ticket State
  const [issuedTicket, setIssuedTicket] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);

  useEffect(() => {
    if (eventSlug) {
      fetchEventDetails();
    }
  }, [eventSlug]);

  const fetchEventDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/public/events/${eventSlug}`);
      if (!res.ok) {
        throw new Error('Event not found');
      }
      const data = await res.json();
      setEventData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Please enter your name and email.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const isFull = eventData?.isFull;
      const endpoint = isFull
        ? `/api/public/events/${eventSlug}/waitlist`
        : `/api/public/events/${eventSlug}/register`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Action failed');
      }

      setSuccessMessage(data.message);

      if (data.qrToken) {
        // Generate QR code image URL for displaying ticket
        const qrDataUrl = await QRCode.toDataURL(data.qrToken, { width: 300, margin: 2 });
        setQrCodeUrl(qrDataUrl);
        setIssuedTicket(data.ticket);
      } else if (data.position) {
        setWaitlistPosition(data.position);
      }

      fetchEventDetails();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!email.trim()) {
      setFormError('Please enter your email to cancel registration.');
      return;
    }

    if (!confirm('Are you sure you want to cancel your registration?')) return;

    setSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/public/events/${eventSlug}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel');

      setSuccessMessage(
        data.promotedUser
          ? `Registration cancelled. Waitlisted attendee (${data.promotedUser.name}) was automatically promoted!`
          : 'Registration cancelled successfully.'
      );
      setIssuedTicket(null);
      setQrCodeUrl('');
      fetchEventDetails();
    } catch (err: any) {
      setFormError(err.message || 'Error cancelling registration');
    } finally {
      setSubmitting(false);
    }
  };

  const accentColor = eventData?.organization?.accent_color || '#6366F1';
  const event = eventData?.event;
  const org = eventData?.organization;
  const isFull = eventData?.isFull;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/org/${orgSlug}`}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {org?.name || 'Organization'}
          </Link>

          <span
            className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            Public Event
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            Loading public event details...
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-8 rounded-2xl text-center">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Main Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  {org?.logo_url ? (
                    <img src={org.logo_url} alt={org.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xl"
                      style={{ backgroundColor: accentColor }}
                    >
                      {org?.name ? org.name.charAt(0) : 'B'}
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-400 font-semibold">{org?.name}</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{event.title}</h1>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 my-4 border-y border-gray-800 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Date & Time</p>
                      <p className="font-semibold text-gray-200">
                        {new Date(event.start_time).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Capacity</p>
                      <p className="font-semibold text-gray-200">
                        {eventData.attendeeCount} / {event.capacity} Registered
                      </p>
                      <p className="text-xs text-indigo-400 font-medium">
                        {eventData.waitlistCount > 0 ? `${eventData.waitlistCount} on waitlist` : 'Seats available'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">About Event</h3>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {event.description || 'No description provided for this event.'}
                  </p>
                </div>

                {event.club_id?.name && (
                  <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-400">Organizing Club:</span>
                    <span className="font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                      {event.club_id.name}
                    </span>
                  </div>
                )}
              </div>

              {/* QR Ticket Output display if issued */}
              {issuedTicket && qrCodeUrl && (
                <div className="bg-gray-900/90 border-2 border-emerald-500/40 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    Registration Confirmed — Pass Ready
                  </div>

                  <h3 className="text-lg font-bold text-white">Your Event Entry QR Ticket</h3>
                  <div className="bg-white p-4 rounded-xl inline-block shadow-inner mx-auto">
                    <img src={qrCodeUrl} alt="Event QR Ticket" className="w-48 h-48 mx-auto" />
                  </div>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Present this QR code at the venue scanner for check-in validation.
                  </p>
                </div>
              )}
            </div>

            {/* Right Interactive Form Box */}
            <div className="space-y-6">
              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm sticky top-24">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <TicketIcon className="w-5 h-5" style={{ color: accentColor }} />
                    {isFull ? 'Waitlist Registration' : 'Event Registration'}
                  </h3>

                  {isFull ? (
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      Event Full
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Available
                    </span>
                  )}
                </div>

                {successMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {formError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: isFull ? '#F59E0B' : accentColor }}
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : isFull ? (
                      'Join Waitlist'
                    ) : (
                      'Get QR Ticket'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={handleCancelRegistration}
                    disabled={submitting || !email}
                    className="text-xs text-gray-400 hover:text-red-400 transition w-full text-center py-1 font-medium disabled:opacity-40"
                  >
                    Need to cancel existing registration? Click here
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
