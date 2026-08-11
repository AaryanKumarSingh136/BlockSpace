import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Invite from '@/models/Invite';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { sendOrgInviteEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user?.org_id || user.role !== 'orgAdmin') {
      return NextResponse.json({ message: 'Only org admins can invite members' }, { status: 403 });
    }

    const organization = await Organization.findById(user.org_id);
    const orgName = organization?.name || 'Organization';

    const { email, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ message: 'Email and role are required' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await Invite.create({
      token,
      org_id: user.org_id,
      email: email.toLowerCase(),
      role,
      expires_at,
    });

    const invite_link = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/join?token=${token}`;

    // Send Org Invite Email
    sendOrgInviteEmail(email.toLowerCase(), invite_link, orgName).catch((err) =>
      console.warn('Org invite email error:', err)
    );

    return NextResponse.json(
      {
        message: 'Invite created and email dispatched',
        invite_link,
        invite,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Something went wrong', error }, { status: 500 });
  }
}