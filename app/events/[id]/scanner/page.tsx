'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ValidationResult {
  valid: boolean;
  status: 'VALID' | 'ALREADY_USED' | 'INVALID';
  message: string;
  attendeeName?: string;
  attendeeEmail?: string;
  used_at?: string;
}

export default function ScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const validateQrCode = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token }),
      });

      const data = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        status: 'INVALID',
        message: err.message || 'Validation request failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const startScanner = () => {
    if (scannerRef.current) return;

    setScannerActive(true);
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        console.log('Scanned QR:', decodedText);
        validateQrCode(decodedText);
      },
      (error) => {
        // quiet scan errors
      }
    );

    scannerRef.current = scanner;
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((err) => console.error(err));
      scannerRef.current = null;
      setScannerActive(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      validateQrCode(manualToken.trim());
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto w-full space-y-6">

        <div className="flex items-center justify-between">
          <Link href={`/events/${id}`} className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-semibold">
            ← Back to Event
          </Link>
          <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-3 py-1 rounded-full font-bold uppercase">
            Organizer Door Scanner
          </span>
        </div>

        <Card className="bg-gray-900 border-gray-800 text-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Live Ticket Scanner</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Scan attendee JWT QR code pass or paste raw token string to validate entrance
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Camera Controls */}
            <div className="flex justify-center gap-3">
              {!scannerActive ? (
                <Button onClick={startScanner} className="bg-indigo-600 hover:bg-indigo-700 font-bold text-sm">
                  📷 Start Camera Scanner
                </Button>
              ) : (
                <Button onClick={stopScanner} variant="outline" className="border-red-700 text-red-400 hover:bg-red-950 text-sm font-bold">
                  Stop Camera Scanner
                </Button>
              )}
            </div>

            {/* Html5Qrcode video container */}
            <div id="qr-reader" className={`w-full overflow-hidden rounded-xl bg-gray-950 ${!scannerActive ? 'hidden' : ''}`} />

            {/* Validation Banner Display */}
            {validationResult && (
              <div
                className={`p-6 rounded-xl border text-center space-y-2 shadow-2xl transition-all ${
                  validationResult.status === 'VALID'
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-emerald-950/50'
                    : validationResult.status === 'ALREADY_USED'
                    ? 'bg-yellow-950/90 border-yellow-500 text-yellow-200 shadow-yellow-950/50'
                    : 'bg-red-950/90 border-red-500 text-red-200 shadow-red-950/50'
                }`}
              >
                <div className="text-4xl font-extrabold">
                  {validationResult.status === 'VALID' && 'VALID ✅'}
                  {validationResult.status === 'ALREADY_USED' && 'ALREADY USED ⚠️'}
                  {validationResult.status === 'INVALID' && 'INVALID ❌'}
                </div>

                <div className="text-lg font-bold">{validationResult.message}</div>

                {validationResult.attendeeName && (
                  <div className="text-sm font-semibold opacity-90 pt-1">
                    Attendee: <span className="underline">{validationResult.attendeeName}</span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Token Fallback Form */}
            <form onSubmit={handleManualSubmit} className="space-y-3 pt-4 border-t border-gray-800">
              <span className="text-xs font-semibold text-gray-400 block">Manual Token Input (Testing / Fallback)</span>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste raw JWT token here..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white text-xs"
                />
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold" disabled={loading}>
                  {loading ? 'Checking...' : 'Validate'}
                </Button>
              </div>
            </form>

          </CardContent>
        </Card>

      </div>
    </main>
  );
}
