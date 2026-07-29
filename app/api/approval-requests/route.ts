import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import ApprovalRequest from '@/models/ApprovalRequest';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const query: any = { org_id: user.org_id };
    if (status !== 'all') {
      query.status = status;
    }

    // Managers/Club Admins see department creation & role promotions for their scope
    // Org Admins see all club creation, department creation & role promotions
    const requests = await ApprovalRequest.find(query)
      .populate('requested_by', 'name email role')
      .populate('target_user_id', 'name email role')
      .populate('club_id', 'name')
      .populate('dept_id', 'name')
      .populate('reviewed_by', 'name email')
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching approval requests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, target_user_id, proposed_role } = body;

    if (!type || type !== 'role_promotion' || !target_user_id || !proposed_role) {
      return NextResponse.json({ message: 'Invalid role promotion request parameters' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const targetUser = await User.findOne({ _id: target_user_id, org_id: user.org_id });
    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found in organization' }, { status: 404 });
    }

    const approvalRequest = await ApprovalRequest.create({
      type: 'role_promotion',
      org_id: user.org_id,
      requested_by: user._id,
      target_user_id: targetUser._id,
      proposed_role,
      status: 'pending',
    });

    return NextResponse.json(
      { message: 'Role promotion request submitted successfully', approvalRequest },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error submitting request' }, { status: 500 });
  }
}
