import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const event = await Event.findOne({ _id: id, org_id: user.org_id });
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    // Check existing registration
    const isAlreadyRegistered = event.attendee_list.some(
      (a: any) => a.toString() === user._id.toString()
    );
    if (isAlreadyRegistered) {
      return NextResponse.json({ message: 'You are already registered for this event' }, { status: 409 });
    }

    // Check capacity
    if (event.attendee_list.length >= event.capacity) {
      return NextResponse.json({ message: 'Event capacity reached' }, { status: 400 });
    }

    const ticketId = new mongoose.Types.ObjectId();

    // Sign JWT token with event's secret
    const jwtPayload = {
      ticketId: ticketId.toString(),
      eventId: event._id.toString(),
      userId: user._id.toString(),
      orgId: user.org_id.toString(),
      eventTitle: event.title,
      userName: user.name,
      userEmail: user.email,
    };

    const jwtToken = jwt.sign(jwtPayload, event.qr_secret, { expiresIn: '30d' });

    // Compute SHA-256 hash of raw JWT string
    const qr_hash = crypto.createHash('sha256').update(jwtToken).digest('hex');

    // Create ticket document storing hash only
    const ticket = await Ticket.create({
      _id: ticketId,
      event_id: event._id,
      user_id: user._id,
      org_id: user.org_id,
      qr_hash,
      used: false,
    });

    // Add to attendee list
    event.attendee_list.push(user._id);
    await event.save();

    return NextResponse.json(
      {
        message: 'Successfully registered for event',
        ticket,
        qrToken: jwtToken,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error registering for event' }, { status: 500 });
  }
}
