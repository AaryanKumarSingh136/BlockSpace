import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ message: 'Name and slug are required' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    await connectDB();

    const existing = await Organization.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json({ message: 'Slug already taken' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const org = await Organization.create({
      name,
      slug: cleanSlug,
      owner_id: user._id,
    });

    await User.findByIdAndUpdate(user._id, {
      org_id: org._id,
      role: 'orgAdmin',
    });

    return NextResponse.json({ message: 'Organization created', org }, { status: 201 });
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
      return NextResponse.json({ org: null });
    }

    const org = await Organization.findById(user.org_id);
    return NextResponse.json({ org });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong', error }, { status: 500 });
  }
}