import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import mongoose from 'mongoose';

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
      return NextResponse.json({ message: 'Name and email are required to join the waitlist' }, { status: 400 });
    }

    // Check if user already exists
    const user = await User.findOne({ email });

    // Check if already in attendee list
    if (user && event.attendee_list?.some((a: any) => a.toString() === user._id.toString())) {
      return NextResponse.json({ message: 'You are already registered for this event' }, { status: 409 });
    }

    // Check if already on waitlist
    const isAlreadyOnWaitlist = event.waitlist?.some(
      (w: any) => w.email?.toLowerCase() === email
    );

    if (isAlreadyOnWaitlist) {
      const currentPosition = event.waitlist.findIndex((w: any) => w.email?.toLowerCase() === email) + 1;
      return NextResponse.json(
        {
          message: `You are already on the waitlist (Position #${currentPosition})`,
          position: currentPosition,
        },
        { status: 409 }
      );
    }

    // Add to waitlist
    event.waitlist.push({
      user_id: user ? user._id : undefined,
      name,
      email,
      created_at: new Date(),
    });

    await event.save();
    const position = event.waitlist.length;

    return NextResponse.json(
      {
        message: `Successfully joined the waitlist! You are position #${position}.`,
        position,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error joining waitlist' },
      { status: 500 }
    );
  }
}
