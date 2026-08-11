import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
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

    const peakHoursAggregation = await Booking.aggregate([
      { $match: { org_id: orgObjectId } },
      {
        $project: {
          hour: { $hour: '$start_time' },
        },
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Map 0 to 23 hours to ensure complete 24-hour distribution
    const hourMap = new Map<number, number>();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, 0);
    }

    peakHoursAggregation.forEach((item) => {
      if (typeof item._id === 'number' && hourMap.has(item._id)) {
        hourMap.set(item._id, item.count);
      }
    });

    const data = Array.from(hourMap.entries()).map(([hour, count]) => {
      const label = `${hour.toString().padStart(2, '0')}:00`;
      return { hour: label, rawHour: hour, count };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error fetching peak hours analytics' },
      { status: 500 }
    );
  }
}
