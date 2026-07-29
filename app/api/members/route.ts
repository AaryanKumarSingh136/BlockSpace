import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Club from '@/models/Club';
import Department from '@/models/Department';

const ROLE_RANK: Record<string, number> = {
  member: 1,
  manager: 2,
  orgAdmin: 3,
  superAdmin: 4,
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    // Ensure models are registered for populate
    await Club.findOne();
    await Department.findOne();

    const members = await User.find({ org_id: currentUser.org_id })
      .select('-passwordHash')
      .populate('club_id', 'name')
      .populate('dept_id', 'name')
      .sort({ joined_at: -1 })
      .lean();

    return NextResponse.json({ members, currentUserRole: currentUser.role }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching members' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { target_user_id, role, club_id, dept_id } = body;

    if (!target_user_id) {
      return NextResponse.json({ message: 'Target user ID is required' }, { status: 400 });
    }

    await connectDB();
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const targetUser = await User.findOne({ _id: target_user_id, org_id: currentUser.org_id });
    if (!targetUser) {
      return NextResponse.json({ message: 'Member not found in organization' }, { status: 404 });
    }

    const currentUserRank = ROLE_RANK[currentUser.role] || 1;

    // Check role promotion permissions (WhatsApp Admin style rule)
    if (role) {
      const newRoleRank = ROLE_RANK[role] || 1;
      if (newRoleRank > currentUserRank) {
        return NextResponse.json(
          { message: `Permission denied. As a ${currentUser.role}, you can only promote users up to ${currentUser.role} level.` },
          { status: 403 }
        );
      }
      targetUser.role = role;
    }

    if (club_id !== undefined) {
      targetUser.club_id = club_id || null;
    }
    if (dept_id !== undefined) {
      targetUser.dept_id = dept_id || null;
    }

    await targetUser.save();

    return NextResponse.json(
      { message: 'Member updated successfully', user: targetUser },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error updating member' }, { status: 500 });
  }
}
