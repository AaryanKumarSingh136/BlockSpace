import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import User from '@/models/User';
import Club from '@/models/Club';
import Department from '@/models/Department';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user?.org_id || !['manager', 'orgAdmin', 'superAdmin'].includes(user.role)) {
      return NextResponse.json({ message: 'Only managers or admins can create resources' }, { status: 403 });
    }

    const { name, type, capacity, club_id, dept_id } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ message: 'Name and type are required' }, { status: 400 });
    }

    const resource = await Resource.create({
      name,
      type,
      capacity,
      org_id: user.org_id,
      club_id: club_id || undefined,
      dept_id: dept_id || undefined,
    });

    return NextResponse.json({ message: 'Resource created', resource }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('club_id');
    const deptId = searchParams.get('dept_id');

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user?.org_id) {
      return NextResponse.json({ resources: [] });
    }

    // Ensure models are registered for populate
    await Club.findOne();
    await Department.findOne();

    const query: any = { org_id: user.org_id };
    if (clubId) query.club_id = clubId;
    if (deptId) query.dept_id = deptId;

    const resources = await Resource.find(query)
      .populate('club_id', 'name')
      .populate('dept_id', 'name')
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ resources });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Something went wrong' }, { status: 500 });
  }
}