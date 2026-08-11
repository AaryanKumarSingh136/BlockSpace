'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Palette, Upload, CheckCircle2, Image as ImageIcon, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
];

export default function BrandingSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [accentColor, setAccentColor] = useState<string>('#6366F1');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<string>('');
  const [orgSlug, setOrgSlug] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in');
    } else if (session?.user && !['orgAdmin', 'superAdmin'].includes(session.user.role || '')) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user && ['orgAdmin', 'superAdmin'].includes(session.user.role || '')) {
      fetchBranding();
    }
  }, [session]);

  const fetchBranding = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organizations/branding');
      if (res.ok) {
        const data = await res.json();
        if (data.organization) {
          setAccentColor(data.organization.accent_color || '#6366F1');
          setLogoUrl(data.organization.logo_url || '');
          setOrgSlug(data.organization.slug || '');
          setOrgName(data.organization.name || 'Your Organization');
        }
      }
    } catch (err) {
      console.error('Error loading branding:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoFile(base64);
        setLogoUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/organizations/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accent_color: accentColor,
          logo_url: logoUrl,
          logo_file: logoFile || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save branding');
      }

      setMessage({ type: 'success', text: 'Organization branding updated successfully!' });
      if (data.organization?.logo_url) {
        setLogoUrl(data.organization.logo_url);
        setLogoFile('');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || (session && !['orgAdmin', 'superAdmin'].includes(session.user?.role || ''))) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-400">
          Checking authorization...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-16">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Palette className="w-8 h-8 text-indigo-500" />
              Custom Org Branding
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Customize your organization's public landing pages, accent color, and brand logo.
            </p>
          </div>

          {orgSlug && (
            <Link
              href={`/org/${orgSlug}`}
              target="_blank"
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition"
            >
              View Public Page
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
            Loading organization settings...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Branding Controls Form */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                Brand Customization
              </h2>

              {message && (
                <div
                  className={`p-4 rounded-xl text-xs mb-6 flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-6">
                {/* Logo Section */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Organization Logo
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="w-16 h-16 rounded-xl object-cover border-2 border-gray-700"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gray-800 border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-500">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1">
                        <label className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold text-xs inline-flex items-center gap-2 cursor-pointer transition shadow-md">
                          <Upload className="w-4 h-4" />
                          Upload Logo Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-gray-400 text-xs mt-1.5">
                          PNG, JPG or SVG up to 5MB. Cloudinary hosted.
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-400">Or paste Logo Image URL:</span>
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value);
                          setLogoFile('');
                        }}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Accent Color Section */}
                <div className="pt-4 border-t border-gray-800">
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Brand Accent Color
                  </label>
                  <p className="text-gray-400 text-xs mb-3">
                    Select a preset swatch or pick a custom hex color.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5 mb-4">
                    {PRESET_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setAccentColor(hex)}
                        className={`w-9 h-9 rounded-xl transition transform hover:scale-105 flex items-center justify-center ${
                          accentColor.toLowerCase() === hex.toLowerCase()
                            ? 'ring-2 ring-white scale-110 shadow-lg'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {accentColor.toLowerCase() === hex.toLowerCase() && (
                          <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-indigo-500 w-32"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-500 shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Branding Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Live Branding Preview Card */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Live Preview
              </h2>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Mock Banner */}
                <div
                  className="py-10 px-6 text-center relative"
                  style={{
                    background: `radial-gradient(circle at top center, ${accentColor}40 0%, rgba(17,24,39,1) 80%)`,
                  }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Org Logo"
                      className="w-16 h-16 rounded-2xl mx-auto mb-3 border-2 border-white/20 shadow-xl object-cover"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center font-black text-white text-2xl shadow-xl"
                      style={{ backgroundColor: accentColor }}
                    >
                      {orgName ? orgName.charAt(0).toUpperCase() : 'B'}
                    </div>
                  )}

                  <h3 className="text-2xl font-extrabold text-white">{orgName || 'Organization Name'}</h3>
                  <p className="text-xs text-gray-400 mt-1">Public Landing Page Header</p>
                </div>

                {/* Mock Card Content */}
                <div className="p-6 space-y-4 bg-gray-950">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">Sample Event</span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        Active
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">Annual Tech Hackathon 2026</h4>
                    <p className="text-xs text-gray-400">Open registration for community members.</p>

                    <button
                      type="button"
                      className="w-full py-2 rounded-lg text-white font-semibold text-xs flex items-center justify-center gap-2 shadow"
                      style={{ backgroundColor: accentColor }}
                    >
                      Register Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
