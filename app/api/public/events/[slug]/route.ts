import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import Organization from '@/models/Organization';
import Club from '@/models/Club';
import Department from '@/models/Department';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    // Ensure dependent models registered
    await Club.findOne();
    await Department.findOne();
    await User.findOne();
    await Organization.findOne();

    let query: any = { slug };
    if (mongoose.Types.ObjectId.isValid(slug)) {
      query = { $or: [{ slug }, { _id: slug }] };
    }

    const event = await Event.findOne(query)
      .populate('organizer_id', 'name email')
      .populate('club_id', 'name')
      .populate('dept_id', 'name')
      .lean();

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const organization = await Organization.findById(event.org_id).lean();

    const attendeeCount = event.attendee_list ? event.attendee_list.length : 0;
    const waitlistCount = event.waitlist ? event.waitlist.length : 0;
    const isFull = attendeeCount >= event.capacity;

    return NextResponse.json(
      {
        event,
        organization: organization
          ? {
              _id: organization._id,
              name: organization.name,
              slug: organization.slug,
              logo_url: organization.logo_url,
              accent_color: organization.accent_color || '#6366F1',
            }
          : null,
        attendeeCount,
        waitlistCount,
        isFull,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error fetching public event details' },
      { status: 500 }
    );
  }
}
