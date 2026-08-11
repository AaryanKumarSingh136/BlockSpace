import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`auth_register_${ip}`, 10, 15 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { message: `Too many registration attempts. Please try again in ${rateCheck.reset} seconds.` },
        { status: 429 }
      );
    }

    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'member',
    });

    // Send Welcome Email asynchronously
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.warn('Welcome email error:', err)
    );

    return NextResponse.json(
      { message: 'User created successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}