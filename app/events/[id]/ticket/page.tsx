'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface TicketData {
  _id: string;
  used: boolean;
  used_at?: string;
  created_at: string;
}

interface EventData {
  _id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [qrToken, setQrToken] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(`/api/events/${id}/ticket`);
        const data = await res.json();

        if (res.ok) {
          setTicket(data.ticket);
          setEvent(data.event);
          setQrToken(data.qrToken);

          // Render QR code to data URL
          const url = await QRCode.toDataURL(data.qrToken, {
            width: 320,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          setQrDataUrl(url);
        } else {
          setError(data.message);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const copyTokenToClipboard = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Generating your JWT QR Code Ticket...</p>
      </main>
    );
  }

  if (error || !ticket || !event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground p-4">
        <Card className="bg-card border-border text-card-foreground p-6 max-w-md w-full text-center">
          <p className="text-destructive mb-4">{error || 'Ticket not found.'}</p>
          <Link href={`/events/${id}`}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Back to Event</Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-6">

        <Link href={`/events/${id}`} className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
          ← Back to Event Page
        </Link>

        <Card className="bg-card border-border text-card-foreground shadow-2xl overflow-hidden">
          <CardHeader className="bg-primary/10 border-b border-border text-center pb-4">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary">Official Entry Pass</span>
            <CardTitle className="text-2xl font-bold mt-1 text-card-foreground">{event.title}</CardTitle>
            <CardDescription className="text-muted-foreground text-xs mt-1">
              {new Date(event.start_time).toLocaleString()}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 text-center space-y-6 flex flex-col items-center">
            
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                  ticket.used
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {ticket.used ? `Used on ${new Date(ticket.used_at!).toLocaleTimeString()}` : 'Valid for Entry ✅'}
              </span>
            </div>

            {/* QR Code Graphic Container */}
            <div className="bg-white p-4 rounded-2xl shadow-inner border-4 border-primary/30">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="JWT QR Code" className="w-64 h-64 mx-auto rounded" />
              )}
            </div>

            <div className="text-xs text-muted-foreground space-y-1 font-mono bg-muted p-3 rounded border border-border w-full text-center">
              <div>Ticket ID: <span className="text-foreground font-bold">{ticket._id}</span></div>
              <div className="text-[10px] text-muted-foreground truncate">SHA-256 Validated • Single-Use Encrypted Pass</div>
            </div>

            {/* Copy JWT Token Helper for testing scanner manually */}
            <div className="w-full pt-2 border-t border-border">
              <Button
                onClick={copyTokenToClipboard}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted text-xs"
              >
                {copied ? 'Copied Token to Clipboard! ✓' : '📋 Copy Raw JWT Token String'}
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </main>
  );
}
