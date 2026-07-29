import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import ApprovalRequest from '@/models/ApprovalRequest';
import Club from '@/models/Club';
import Department from '@/models/Department';
import User from '@/models/User';

const ROLE_RANK: Record<string, number> = {
  member: 1,
  manager: 2,
  orgAdmin: 3,
  superAdmin: 4,
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action. Must be approve or reject' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const request = await ApprovalRequest.findOne({ _id: id, org_id: user.org_id });
    if (!request) {
      return NextResponse.json({ message: 'Approval request not found' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ message: `Request is already ${request.status}` }, { status: 400 });
    }

    const userRank = ROLE_RANK[user.role] || 1;
    const isOrgAdmin = ['orgAdmin', 'superAdmin'].includes(user.role);

    // Permission checks per request type
    if (request.type === 'club_creation') {
      if (!isOrgAdmin) {
        return NextResponse.json({ message: 'Only Org Admins can approve club creation requests' }, { status: 403 });
      }
    } else if (request.type === 'department_creation') {
      let canApprove = isOrgAdmin;
      if (!canApprove && request.club_id) {
        const club = await Club.findById(request.club_id);
        if (club && club.admin_id && club.admin_id.toString() === user._id.toString()) {
          canApprove = true;
        }
      }
      if (!canApprove) {
        return NextResponse.json({ message: 'Only Club Admins or Org Admins can approve department creation requests' }, { status: 403 });
      }
    } else if (request.type === 'role_promotion') {
      const proposedRank = ROLE_RANK[request.proposed_role || 'member'] || 1;
      if (userRank < proposedRank) {
        return NextResponse.json({ message: 'You cannot approve a promotion higher than your own role level' }, { status: 403 });
      }
    }

    if (action === 'reject') {
      request.status = 'rejected';
      request.reviewed_by = user._id;
      request.reviewed_at = new Date();
      await request.save();

      return NextResponse.json({ message: 'Request rejected', request }, { status: 200 });
    }

    // Action === 'approve'
    if (request.type === 'club_creation') {
      const newClub = await Club.create({
        name: request.details?.name,
        description: request.details?.description || '',
        org_id: request.org_id,
        admin_id: request.requested_by,
        status: 'approved',
      });

      // Optionally update requested user role to manager or orgAdmin if currently member
      const requester = await User.findById(request.requested_by);
      if (requester && requester.role === 'member') {
        requester.role = 'manager';
        requester.club_id = newClub._id;
        await requester.save();
      }
    } else if (request.type === 'department_creation') {
      const newDept = await Department.create({
        name: request.details?.name,
        description: request.details?.description || '',
        club_id: request.club_id,
        org_id: request.org_id,
        admin_id: request.requested_by,
        status: 'approved',
      });

      const requester = await User.findById(request.requested_by);
      if (requester) {
        requester.dept_id = newDept._id;
        if (requester.role === 'member') {
          requester.role = 'manager';
        }
        await requester.save();
      }
    } else if (request.type === 'role_promotion') {
      if (request.target_user_id && request.proposed_role) {
        await User.findByIdAndUpdate(request.target_user_id, {
          role: request.proposed_role,
        });
      }
    }

    request.status = 'approved';
    request.reviewed_by = user._id;
    request.reviewed_at = new Date();
    await request.save();

    return NextResponse.json({ message: 'Request approved successfully', request }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error processing request' }, { status: 500 });
  }
}
