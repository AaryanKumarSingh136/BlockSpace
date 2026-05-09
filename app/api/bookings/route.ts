import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Resource from '@/models/Resource';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { resource_id, title, start_time, end_time } = await req.json();
    if (!resource_id || !title || !start_time || !end_time) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const start = new Date(start_time);
    const end = new Date(end_time);

    if (start >= end) {
      return NextResponse.json({ message: 'End time must be after start time' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.org_id) {
      return NextResponse.json({ message: 'You must be part of an organization' }, { status: 403 });
    }

    const resource = await Resource.findOne({ _id: resource_id, org_id: user.org_id });
    if (!resource) {
      return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
    }

    // ── CONFLICT DETECTION ──────────────────────────────────────────
    const conflict = await Booking.findOne({
      resource_id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { start_time: { $lt: end }, end_time: { $gt: start } },
      ],
    });

    if (conflict) {
      return NextResponse.json({ message: 'This resource is already booked for that time slot' }, { status: 409 });
    }

    // ── MONGODB TRANSACTION ─────────────────────────────────────────
    const dbSession = await mongoose.startSession();
    let booking;

    await dbSession.withTransaction(async () => {
      [booking] = await Booking.create([{
        resource_id,
        user_id: user._id,
        org_id: user.org_id,
        title,
        start_time: start,
        end_time: end,
      }], { session: dbSession });
    });

    dbSession.endSession();

    return NextResponse.json({ message: 'Booking created', booking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong', error }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.org_id) {
      return NextResponse.json({ bookings: [] });
    }

    const bookings = await Booking.find({ org_id: user.org_id })
      .populate('resource_id', 'name type')
      .populate('user_id', 'name email')
      .sort({ start_time: 1 });

    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong', error }, { status: 500 });
  }
}