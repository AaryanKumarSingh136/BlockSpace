import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Ticket from '@/models/Ticket';
import User from '@/models/User';
import mongoose from 'mongoose';
import { sendWaitlistPromotedEmail } from '@/lib/email';

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

    let email = body.email?.trim()?.toLowerCase();
    if (session?.user?.email) {
      email = session.user.email.toLowerCase();
    }

    if (!email) {
      return NextResponse.json({ message: 'Email required to cancel registration' }, { status: 400 });
    }

    const userToCancel = await User.findOne({ email });
    if (!userToCancel) {
      return NextResponse.json({ message: 'User registration not found' }, { status: 404 });
    }

    // Remove from attendee list
    const initialAttendeeCount = event.attendee_list.length;
    event.attendee_list = event.attendee_list.filter(
      (a: any) => a.toString() !== userToCancel._id.toString()
    );

    if (event.attendee_list.length === initialAttendeeCount) {
      return NextResponse.json(
        { message: 'You are not registered for this event' },
        { status: 404 }
      );
    }

    // Remove ticket
    await Ticket.deleteOne({ event_id: event._id, user_id: userToCancel._id });

    let promotedUser = null;

    // WAITLIST AUTO-PROMOTION LOGIC
    if (event.waitlist && event.waitlist.length > 0) {
      const nextPerson = event.waitlist.shift(); // First user auto-promoted!

      if (nextPerson) {
        let pUser = await User.findOne({ email: nextPerson.email.toLowerCase() });
        if (!pUser) {
          const dummyPassword = crypto.randomBytes(16).toString('hex');
          pUser = await User.create({
            name: nextPerson.name,
            email: nextPerson.email.toLowerCase(),
            passwordHash: dummyPassword,
            role: 'member',
            org_id: event.org_id,
          });
        }

        const ticketId = new mongoose.Types.ObjectId();
        const jwtPayload = {
          ticketId: ticketId.toString(),
          eventId: event._id.toString(),
          userId: pUser._id.toString(),
          orgId: event.org_id.toString(),
          eventTitle: event.title,
          userName: pUser.name,
          userEmail: pUser.email,
        };

        const jwtToken = jwt.sign(jwtPayload, event.qr_secret, { expiresIn: '30d' });
        const qr_hash = crypto.createHash('sha256').update(jwtToken).digest('hex');

        await Ticket.create({
          _id: ticketId,
          event_id: event._id,
          user_id: pUser._id,
          org_id: event.org_id,
          qr_hash,
          used: false,
        });

        event.attendee_list.push(pUser._id);
        promotedUser = {
          name: pUser.name,
          email: pUser.email,
        };

        // Send Waitlist Promoted Email Notification
        sendWaitlistPromotedEmail(pUser.email, event.title).catch((err) =>
          console.warn('Waitlist promotion email error:', err)
        );
      }
    }

    await event.save();

    return NextResponse.json(
      {
        message: 'Registration cancelled successfully',
        promotedUser,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error cancelling registration' },
      { status: 500 }
    );
  }
}
