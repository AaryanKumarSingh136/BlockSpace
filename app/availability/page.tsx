'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ResourceItem {
  _id: string;
  name: string;
  type: string;
  capacity?: number;
  current_status: 'available' | 'occupied' | 'maintenance';
  club_id?: { _id: string; name: string };
  dept_id?: { _id: string; name: string };
}

interface BookingItem {
  _id: string;
  resource_id: { _id: string; name: string } | string;
  user_id: { name: string; email: string } | string;
  title: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
}

export default function AvailabilityPage() {
  const { data: session } = useSession();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quick book modal state
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [bookingForm, setBookingForm] = useState({
    title: '',
    start_time: '',
    end_time: '',
  });

  const [bookingLoading, setBookingLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [resResources, resBookings] = await Promise.all([
        fetch('/api/resources'),
        fetch('/api/bookings'),
      ]);

      if (resResources.ok) {
        const data = await resResources.json();
        setResources(data.resources || []);
      }
      if (resBookings.ok) {
        const data = await resBookings.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching live availability:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Socket.io Real-Time Setup
  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setIsConnected(true);
      if (session?.user?.org_id) {
        socket.emit('join-org', session.user.org_id);
      }
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onResourceUpdated(data: any) {
      console.log('[Socket.io] Live event received:', data);
      // Re-fetch clean state from server when a resource update occurs in this org
      fetchDashboardData();
    }

    if (socket.connected) {
      setIsConnected(true);
      if (session?.user?.org_id) {
        socket.emit('join-org', session.user.org_id);
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('resource-updated', onResourceUpdated);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('resource-updated', onResourceUpdated);
      if (session?.user?.org_id) {
        socket.emit('leave-org', session.user.org_id);
      }
    };
  }, [session?.user?.org_id, fetchDashboardData]);

  // Determine active booking for a given resource
  const getActiveBooking = (resourceId: string) => {
    const now = new Date();
    return bookings.find((b) => {
      const resId = typeof b.resource_id === 'object' ? b.resource_id._id : b.resource_id;
      if (resId !== resourceId) return false;
      if (!['pending', 'approved'].includes(b.status)) return false;

      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      return start <= now && now <= end;
    });
  };

  // Determine resource status (available vs occupied)
  const getResourceStatus = (r: ResourceItem) => {
    if (r.current_status === 'maintenance') return 'maintenance';
    const active = getActiveBooking(r._id);
    if (active) return active.status === 'approved' ? 'occupied' : 'pending_approval';
    return 'available';
  };

  // OPTIMISTIC BOOKING WORKFLOW
  const handleOptimisticBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    setBookingLoading(true);
    setAlertMsg(null);

    const prevBookings = [...bookings];
    const prevResources = [...resources];

    // 1. OPTIMISTIC UPDATE: Create temporary booking in state immediately
    const tempBookingId = `temp-${Date.now()}`;
    const tempBooking: BookingItem = {
      _id: tempBookingId,
      resource_id: { _id: selectedResource._id, name: selectedResource.name },
      user_id: { name: session?.user?.name || 'You', email: session?.user?.email || '' },
      title: bookingForm.title,
      start_time: bookingForm.start_time,
      end_time: bookingForm.end_time,
      status: 'pending',
    };

    setBookings((prev) => [...prev, tempBooking]);

    try {
      // 2. NETWORK CALL
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: selectedResource._id,
          title: bookingForm.title,
          start_time: bookingForm.start_time,
          end_time: bookingForm.end_time,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 3. ROLLBACK ON FAILURE
        setBookings(prevBookings);
        setResources(prevResources);
        setAlertMsg({ type: 'error', text: `Booking Failed (Rolled Back): ${data.message}` });
        setBookingLoading(false);
        return;
      }

      // 4. CONFIRM SUCCESS & BROADCAST VIA SOCKET
      setAlertMsg({ type: 'success', text: 'Resource booked successfully! Live dashboard updated.' });
      setSelectedResource(null);
      setBookingForm({ title: '', start_time: '', end_time: '' });

      // Emit socket event to notify other connected clients in room
      const socket = getSocket();
      socket.emit('resource-updated', {
        org_id: session?.user?.org_id,
        resource_id: selectedResource._id,
        action: 'booking_created',
      });

      fetchDashboardData();
    } catch (err: any) {
      // ROLLBACK ON EXCEPTION
      setBookings(prevBookings);
      setResources(prevResources);
      setAlertMsg({ type: 'error', text: `Network Error: ${err.message}. Rolled back.` });
    } finally {
      setBookingLoading(false);
    }
  };

  // Filter resources
  const filteredResources = resources.filter((r) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">

        {/* Dashboard Header & Live Indicator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Live Resource Availability</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time WebSocket dashboard for instant conflict-free resource tracking
            </p>
          </div>

          {/* Connection Indicator Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm transition-all ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isConnected ? 'Live Connected (Socket.io)' : 'Connecting to Server...'}
            </div>
          </div>
        </div>

        {/* Alert Notifications */}
        {alertMsg && (
          <div
            className={`p-4 rounded-lg border text-sm font-medium flex items-center justify-between ${
              alertMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            <span>{alertMsg.text}</span>
            <button onClick={() => setAlertMsg(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/60 p-4 rounded-xl border border-border">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search resource name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted border-border text-foreground w-full sm:w-64"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {['all', 'room', 'desk', 'equipment', 'court'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${
                  filterType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Live Availability Grid */}
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading live availability...</div>
        ) : filteredResources.length === 0 ? (
          <Card className="bg-card border-border text-muted-foreground p-8 text-center">
            No resources match your search filter.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredResources.map((r) => {
              const status = getResourceStatus(r);
              const activeBooking = getActiveBooking(r._id);

              return (
                <Card
                  key={r._id}
                  className={`bg-card border text-card-foreground transition-all hover:border-ring flex flex-col justify-between ${
                    status === 'occupied'
                      ? 'border-destructive/60'
                      : status === 'pending_approval'
                      ? 'border-amber-500/60'
                      : 'border-border'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-lg text-card-foreground">{r.name}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          status === 'available'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : status === 'occupied'
                            ? 'bg-destructive/10 text-destructive border border-destructive/30'
                            : status === 'pending_approval'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <CardDescription className="text-muted-foreground text-xs capitalize flex items-center gap-2">
                      Type: {r.type} {r.capacity ? `• Capacity: ${r.capacity}` : ''}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    {/* Active Booking Details */}
                    {activeBooking ? (
                      <div className="bg-muted/60 p-3 rounded-lg border border-border text-xs space-y-1">
                        <div className="font-semibold text-foreground truncate">{activeBooking.title}</div>
                        <div className="text-muted-foreground">
                          Booked by:{' '}
                          <span className="text-primary font-medium">
                            {typeof activeBooking.user_id === 'object'
                              ? activeBooking.user_id.name
                              : 'User'}
                          </span>
                        </div>
                        <div className="text-muted-foreground font-mono text-[11px]">
                          {new Date(activeBooking.start_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          →{' '}
                          {new Date(activeBooking.end_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic py-2">
                        Currently clear & ready for instant booking.
                      </div>
                    )}

                    {/* Scoping Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {r.club_id?.name && (
                        <span className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-medium">
                          {r.club_id.name}
                        </span>
                      )}
                      {r.dept_id?.name && (
                        <span className="text-[11px] bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-medium">
                          {r.dept_id.name}
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => {
                        setSelectedResource(r);
                        // Default start time now, end time +1hr
                        const now = new Date();
                        const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
                        setBookingForm({
                          title: 'Live Event Slot',
                          start_time: now.toISOString().slice(0, 16),
                          end_time: nextHour.toISOString().slice(0, 16),
                        });
                      }}
                      className={`w-full text-xs font-semibold ${
                        status === 'available'
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {status === 'available' ? 'Quick Book Now' : 'Book Conflict-Free Slot'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>

      {/* Quick Booking Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border text-card-foreground rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">Book {selectedResource.name}</h2>
              <p className="text-xs text-muted-foreground">
                Optimistic update: Dashboard updates instantly across all connected clients.
              </p>
            </div>

            <form onSubmit={handleOptimisticBook} className="space-y-4">
              <div>
                <Label>Event / Booking Title</Label>
                <Input
                  placeholder="e.g. Team Planning Sync"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="bg-muted border-border text-foreground mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                    className="bg-muted border-border text-foreground text-xs mt-1"
                    required
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                    className="bg-muted border-border text-foreground text-xs mt-1"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedResource(null)}
                  className="border-border text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={bookingLoading}>
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
