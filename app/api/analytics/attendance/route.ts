import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    if (!['orgAdmin', 'superAdmin'].includes(user.role)) {
      return NextResponse.json({ message: 'Access denied: Org Admin only' }, { status: 403 });
    }

    const orgObjectId = new mongoose.Types.ObjectId(user.org_id.toString());

    const attendanceStats = await Event.aggregate([
      { $match: { org_id: orgObjectId } },
      {
        $project: {
          _id: 1,
          title: 1,
          capacity: 1,
          attendees: { $size: { $ifNull: ['$attendee_list', []] } },
          start_time: 1,
        },
      },
      { $sort: { start_time: -1 } },
      { $limit: 10 },
    ]);

    const data = attendanceStats.map((item) => ({
      title: item.title,
      attendees: item.attendees,
      capacity: item.capacity,
      occupancyRate: item.capacity > 0 ? Math.round((item.attendees / item.capacity) * 100) : 0,
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error fetching attendance analytics' },
      { status: 500 }
    );
  }
}
