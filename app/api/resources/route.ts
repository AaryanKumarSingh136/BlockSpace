import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Resource from '@/models/Resource';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user?.org_id || !['manager', 'orgAdmin'].includes(user.role)) {
      return NextResponse.json({ message: 'Only managers or admins can create resources' }, { status: 403 });
    }

    const { name, type, capacity } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ message: 'Name and type are required' }, { status: 400 });
    }

    const resource = await Resource.create({
      name,
      type,
      capacity,
      org_id: user.org_id,
    });

    return NextResponse.json({ message: 'Resource created', resource }, { status: 201 });
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
      return NextResponse.json({ resources: [] });
    }

    const resources = await Resource.find({ org_id: user.org_id });
    return NextResponse.json({ resources });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong', error }, { status: 500 });
  }
}