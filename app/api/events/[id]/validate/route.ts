import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Ticket from '@/models/Ticket';
import User from '@/models/User';

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
    const { qrToken } = await req.json();

    if (!qrToken || typeof qrToken !== 'string') {
      return NextResponse.json(
        { valid: false, status: 'INVALID', message: 'Missing or invalid QR token ❌' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const event = await Event.findOne({ _id: id, org_id: user.org_id });
    if (!event) {
      return NextResponse.json(
        { valid: false, status: 'INVALID', message: 'Event not found ❌' },
        { status: 404 }
      );
    }

    // Verify JWT signature using event's unique secret
    let decoded: any;
    try {
      decoded = jwt.verify(qrToken, event.qr_secret);
    } catch (err) {
      return NextResponse.json(
        { valid: false, status: 'INVALID', message: 'Invalid signature or expired QR code ❌' },
        { status: 200 }
      );
    }

    // Compute SHA-256 hash of scanned token string
    const qr_hash = crypto.createHash('sha256').update(qrToken).digest('hex');

    // Find ticket by hash or ticketId
    const ticket = await Ticket.findOne({
      $or: [{ qr_hash }, { _id: decoded.ticketId }],
      event_id: event._id,
    });

    if (!ticket) {
      return NextResponse.json(
        { valid: false, status: 'INVALID', message: 'Ticket record not found ❌' },
        { status: 200 }
      );
    }

    // Check single-use status
    if (ticket.used) {
      return NextResponse.json(
        {
          valid: false,
          status: 'ALREADY_USED',
          message: `Ticket already used on ${new Date(ticket.used_at!).toLocaleString()} ⚠️`,
          used_at: ticket.used_at,
          attendeeName: decoded.userName || 'Attendee',
        },
        { status: 200 }
      );
    }

    // Mark as used atomically
    ticket.used = true;
    ticket.used_at = new Date();
    await ticket.save();

    return NextResponse.json(
      {
        valid: true,
        status: 'VALID',
        message: `Ticket Verified! Welcome ${decoded.userName || 'Attendee'} ✅`,
        attendeeName: decoded.userName || 'Attendee',
        attendeeEmail: decoded.userEmail || '',
        ticketId: ticket._id.toString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, status: 'INVALID', message: error.message || 'Validation error ❌' },
      { status: 500 }
    );
  }
}
