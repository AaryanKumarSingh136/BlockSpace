import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Ticket from '@/models/Ticket';
import User from '@/models/User';

export async function GET(
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

    const event = await Event.findOne({ _id: id, org_id: user.org_id }).lean();
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const ticket = await Ticket.findOne({ event_id: event._id, user_id: user._id }).lean();
    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found for this user' }, { status: 404 });
    }

    // Re-sign JWT payload for rendering QR code
    const jwtPayload = {
      ticketId: ticket._id.toString(),
      eventId: event._id.toString(),
      userId: user._id.toString(),
      orgId: user.org_id.toString(),
      eventTitle: event.title,
      userName: user.name,
      userEmail: user.email,
    };

    const qrToken = jwt.sign(jwtPayload, event.qr_secret, { expiresIn: '30d' });

    return NextResponse.json({ ticket, event, qrToken }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching ticket' }, { status: 500 });
  }
}
