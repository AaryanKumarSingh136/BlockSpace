import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`auth_reset_${ip}`, 5, 15 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { message: `Too many password reset attempts. Please try again in ${rateCheck.reset} seconds.` },
        { status: 429 }
      );
    }

    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ message: 'Email and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      // Return 200 for security so attackers cannot enumerate valid user emails
      return NextResponse.json(
        { message: 'If an account with that email exists, the password has been updated. You can now sign in.' },
        { status: 200 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    await user.save();

    return NextResponse.json(
      { message: 'Password has been reset successfully. You can now sign in with your new password.' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error resetting password' },
      { status: 500 }
    );
  }
}
