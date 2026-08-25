import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: Request) {
  const rateCheck = checkRateLimit(`auth_reset_request_${getClientIp(req)}`, 3, 15 * 60 * 1000);
  if (!rateCheck.success) {
    return NextResponse.json({ message: 'Too many reset requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/forgot-password?token=${token}`;
      await sendPasswordResetEmail(user.email, resetLink);
    }

    return NextResponse.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch {
    return NextResponse.json({ message: 'Unable to process reset request' }, { status: 500 });
  }
}