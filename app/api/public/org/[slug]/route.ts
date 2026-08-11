import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Department from '@/models/Department';
import User from '@/models/User';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    await Club.findOne();
    await Department.findOne();
    await User.findOne();

    const organization = await Organization.findOne({ slug }).lean();
    if (!organization) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }

    const events = await Event.find({
      org_id: organization._id,
      is_public: true,
    })
      .populate('organizer_id', 'name email')
      .populate('club_id', 'name')
      .sort({ start_time: 1 })
      .lean();

    return NextResponse.json(
      {
        organization: {
          _id: organization._id,
          name: organization.name,
          slug: organization.slug,
          logo_url: organization.logo_url || '',
          accent_color: organization.accent_color || '#6366F1',
        },
        events,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error fetching public organization details' },
      { status: 500 }
    );
  }
}
