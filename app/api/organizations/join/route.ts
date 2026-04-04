import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Invite from '@/models/Invite';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ message: 'Token is required' }, { status: 400 });
    }

    await connectDB();

    const invite = await Invite.findOne({ token });
    if (!invite) {
      return NextResponse.json({ message: 'Invalid invite token' }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ message: 'Invite already used' }, { status: 400 });
    }

    if (invite.expires_at < new Date()) {
      return NextResponse.json({ message: 'Invite expired' }, { status: 400 });
    }

    await User.findOneAndUpdate(
      { email: session.user.email },
      { org_id: invite.org_id, role: invite.role }
    );

    await Invite.findByIdAndUpdate(invite._id, { used: true });

    return NextResponse.json({ message: 'Joined organization successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong', error }, { status: 500 });
  }
}