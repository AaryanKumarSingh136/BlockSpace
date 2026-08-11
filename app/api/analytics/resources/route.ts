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

    const topResources = await Booking.aggregate([
      { $match: { org_id: orgObjectId } },
      { $group: { _id: '$resource_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'resources',
          localField: '_id',
          foreignField: '_id',
          as: 'resource',
        },
      },
      { $unwind: '$resource' },
      {
        $project: {
          _id: 1,
          name: '$resource.name',
          type: '$resource.type',
          count: 1,
        },
      },
    ]);

    return NextResponse.json({ data: topResources }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error fetching resource analytics' },
      { status: 500 }
    );
  }
}
