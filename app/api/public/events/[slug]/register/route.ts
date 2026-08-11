import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import mongoose from 'mongoose';
import { sendEventRegistrationEmail } from '@/lib/email';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const session = await getServerSession();

    await connectDB();

    let query: any = { slug };
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = { $or: [{ slug }, { _id: slug }] };
    }

    const event = await Event.findOne(query);
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    let name = body.name?.trim();
    let email = body.email?.trim()?.toLowerCase();

    if (session?.user?.email) {
      email = session.user.email.toLowerCase();
      name = session.user.name || name || email.split('@')[0];
    }

    if (!name || !email) {
      return NextResponse.json({ message: 'Name and email are required for registration' }, { status: 400 });
    }

    // Capacity Check
    if (event.attendee_list && event.attendee_list.length >= event.capacity) {
      return NextResponse.json(
        { message: 'Event is full. Please join the waitlist.', isFull: true },
        { status: 400 }
      );
    }

    // Find or create User record
    let user = await User.findOne({ email });
    if (!user) {
      const dummyPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name,
        email,
        passwordHash: dummyPassword,
        role: 'member',
        org_id: event.org_id,
      });
    }

    // Check if user is already registered
    const isAlreadyRegistered = event.attendee_list?.some(
      (a: any) => a.toString() === user._id.toString()
    );

    if (isAlreadyRegistered) {
      return NextResponse.json(
        { message: 'You are already registered for this event' },
        { status: 409 }
      );
    }

    const ticketId = new mongoose.Types.ObjectId();

    // Sign JWT token with event's qr_secret
    const jwtPayload = {
      ticketId: ticketId.toString(),
      eventId: event._id.toString(),
      userId: user._id.toString(),
      orgId: event.org_id.toString(),
      eventTitle: event.title,
      userName: user.name,
      userEmail: user.email,
    };

    const jwtToken = jwt.sign(jwtPayload, event.qr_secret, { expiresIn: '30d' });
    const qr_hash = crypto.createHash('sha256').update(jwtToken).digest('hex');

    const ticket = await Ticket.create({
      _id: ticketId,
      event_id: event._id,
      user_id: user._id,
      org_id: event.org_id,
      qr_hash,
      used: false,
    });

    event.attendee_list.push(user._id);

    // Remove from waitlist if was on waitlist
    if (event.waitlist) {
      event.waitlist = event.waitlist.filter((item: any) => item.email?.toLowerCase() !== email);
    }

    await event.save();

    // Send Event Registration Email
    sendEventRegistrationEmail(user.email, event.title, jwtToken).catch((err) =>
      console.warn('Event registration email error:', err)
    );

    return NextResponse.json(
      {
        message: 'Successfully registered for event',
        ticket,
        qrToken: jwtToken,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error registering for public event' },
      { status: 500 }
    );
  }
}
