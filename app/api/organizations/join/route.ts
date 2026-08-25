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

    const invite = await Invite.findOne({ token }).lean();
    if (!invite) {
      return NextResponse.json({ message: 'Invalid invite token' }, { status: 404 });
    }

    if (invite.used) {
      return NextResponse.json({ message: 'Invite already used' }, { status: 400 });
    }

    if (invite.expires_at < new Date()) {
      return NextResponse.json({ message: 'Invite expired' }, { status: 400 });
    }

    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ message: 'This invite was issued for a different email address' }, { status: 403 });
    }

    const claimedInvite = await Invite.findOneAndUpdate(
      { _id: invite._id, used: false, expires_at: { $gt: new Date() } },
      { used: true },
      { new: true }
    );
    if (!claimedInvite) {
      return NextResponse.json({ message: 'Invite is no longer available' }, { status: 409 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email, $or: [{ org_id: { $exists: false } }, { org_id: null }] },
      { org_id: invite.org_id, role: invite.role }
    );

    if (!updatedUser) {
      await Invite.findByIdAndUpdate(invite._id, { used: false });
      return NextResponse.json({ message: 'You already belong to an organization' }, { status: 409 });
    }

    return NextResponse.json({ message: 'Joined organization successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Something went wrong', error }, { status: 500 });
  }
}