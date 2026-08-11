import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Event from '@/models/Event';
import Club from '@/models/Club';
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

    // Aggregate club activity from Events and Resource Bookings
    const eventClubStats = await Event.aggregate([
      { $match: { org_id: orgObjectId, club_id: { $ne: null } } },
      { $group: { _id: '$club_id', eventCount: { $sum: 1 } } },
    ]);

    const bookingClubStats = await Booking.aggregate([
      { $match: { org_id: orgObjectId } },
      {
        $lookup: {
          from: 'resources',
          localField: 'resource_id',
          foreignField: '_id',
          as: 'resource',
        },
      },
      { $unwind: '$resource' },
      { $match: { 'resource.club_id': { $ne: null } } },
      { $group: { _id: '$resource.club_id', bookingCount: { $sum: 1 } } },
    ]);

    const clubs = await Club.find({ org_id: user.org_id }).lean();

    const clubActivityMap = new Map<string, { name: string; count: number }>();
    clubs.forEach((club) => {
      clubActivityMap.set(club._id.toString(), { name: club.name, count: 0 });
    });

    eventClubStats.forEach((stat) => {
      const idStr = stat._id?.toString();
      if (idStr && clubActivityMap.has(idStr)) {
        const item = clubActivityMap.get(idStr)!;
        item.count += stat.eventCount * 2; // Weight events higher
      }
    });

    bookingClubStats.forEach((stat) => {
      const idStr = stat._id?.toString();
      if (idStr && clubActivityMap.has(idStr)) {
        const item = clubActivityMap.get(idStr)!;
        item.count += stat.bookingCount;
      }
    });

    const data = Array.from(clubActivityMap.values())
      .filter((item) => item.count > 0 || clubs.length <= 5)
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error fetching club analytics' },
      { status: 500 }
    );
  }
}
