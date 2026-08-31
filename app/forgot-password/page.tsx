'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Mail, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token') || '';
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const endpoint = resetToken ? '/api/auth/reset-password' : '/api/auth/request-reset';
      const body = resetToken ? { token: resetToken, newPassword } : { email: email.trim() };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setMessage(data.message || 'Password updated successfully! You can now sign in.');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background text-foreground p-4 sm:p-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px]" />

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary p-px shadow-xl shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-background">
                <span className="text-2xl font-black tracking-wider text-primary">B</span>
              </div>
            </div>
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {resetToken ? 'Choose a new password for your account' : 'Enter your email to receive a secure reset link'}
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-border relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-primary opacity-80" />

          {message ? (
            <div className="space-y-6 text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Password Reset Complete</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
              </div>
              <Link
                href="/sign-in"
                className="w-full h-12 cyber-gradient-btn text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {!resetToken && <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Account Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-ring transition-all text-sm"
                    required
                  />
                </div>
              </div>}

              {resetToken && <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-ring transition-all text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>}

              {error && (
                <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl animate-in fade-in duration-200">
                  <p className="text-destructive text-xs font-medium leading-relaxed">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 cyber-gradient-btn text-white font-bold rounded-xl shadow-lg text-sm flex items-center justify-center gap-2 group transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {resetToken ? 'Resetting Password...' : 'Sending Reset Link...'}
                  </span>
                ) : (
                  <>
                    <span>{resetToken ? 'Reset Password' : 'Send Reset Link'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link href="/sign-in" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
