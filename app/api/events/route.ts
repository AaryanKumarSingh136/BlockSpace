import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import Club from '@/models/Club';
import Department from '@/models/Department';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ events: [] });
    }

    // Ensure models registered for populate
    await Club.findOne();
    await Department.findOne();

    const events = await Event.find({ org_id: user.org_id })
      .populate('organizer_id', 'name email')
      .populate('club_id', 'name')
      .populate('dept_id', 'name')
      .sort({ start_time: 1 })
      .lean();

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user || !user.org_id || !['manager', 'orgAdmin', 'superAdmin'].includes(user.role)) {
      return NextResponse.json({ message: 'Only managers or admins can create events' }, { status: 403 });
    }

    const { title, description, start_time, end_time, capacity, club_id, dept_id, is_public } = await req.json();

    if (!title || !start_time || !end_time || !capacity) {
      return NextResponse.json({ message: 'Title, start time, end time, and capacity are required' }, { status: 400 });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (start >= end) {
      return NextResponse.json({ message: 'End time must be after start time' }, { status: 400 });
    }

    // Generate secret for QR JWT signing
    const qr_secret = crypto.randomBytes(32).toString('hex');

    const event = await Event.create({
      title: title.trim(),
      description: description?.trim() || '',
      organizer_id: user._id,
      org_id: user.org_id,
      club_id: club_id || undefined,
      dept_id: dept_id || undefined,
      start_time: start,
      end_time: end,
      capacity: parseInt(capacity),
      qr_secret,
      is_public: is_public ?? true,
    });

    return NextResponse.json({ message: 'Event created successfully', event }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error creating event' }, { status: 500 });
  }
}
