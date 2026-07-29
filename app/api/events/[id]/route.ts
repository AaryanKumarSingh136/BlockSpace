import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import Club from '@/models/Club';
import Department from '@/models/Department';

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

    await Club.findOne();
    await Department.findOne();

    const event = await Event.findOne({ _id: id, org_id: user.org_id })
      .populate('organizer_id', 'name email')
      .populate('club_id', 'name')
      .populate('dept_id', 'name')
      .populate('attendee_list', 'name email')
      .lean();

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 });
    }

    const isRegistered = event.attendee_list?.some(
      (a: any) => a._id?.toString() === user._id.toString() || a.toString() === user._id.toString()
    );

    return NextResponse.json({ event, isRegistered }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching event' }, { status: 500 });
  }
}
