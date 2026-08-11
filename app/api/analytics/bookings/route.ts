import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Event from '@/models/Event';
import User from '@/models/User';
import Resource from '@/models/Resource';
import mongoose from 'mongoose';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orgObjectId = new mongoose.Types.ObjectId(user.org_id.toString());

    // Bookings over time aggregation
    const bookingAggregation = await Booking.aggregate([
      {
        $match: {
          org_id: orgObjectId,
          created_at: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format map for all dates in range to ensure continuous timeline
    const dateMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    bookingAggregation.forEach((item) => {
      if (dateMap.has(item._id)) {
        dateMap.set(item._id, item.count);
      }
    });

    const data = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    // Summary counts for dashboard metrics
    const totalBookings = await Booking.countDocuments({ org_id: user.org_id });
    const totalEvents = await Event.countDocuments({ org_id: user.org_id });
    const totalMembers = await User.countDocuments({ org_id: user.org_id });
    const activeResources = await Resource.countDocuments({
      org_id: user.org_id,
      current_status: 'available',
    });

    return NextResponse.json(
      {
        data,
        summary: {
          totalBookings,
          totalEvents,
          totalMembers,
          activeResources,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error fetching booking analytics' },
      { status: 500 }
    );
  }
}
