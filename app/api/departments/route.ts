import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Department from '@/models/Department';
import Club from '@/models/Club';
import User from '@/models/User';
import ApprovalRequest from '@/models/ApprovalRequest';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('club_id');

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const query: any = { org_id: user.org_id };
    if (clubId) {
      query.club_id = clubId;
    }

    const departments = await Department.find(query)
      .populate('club_id', 'name')
      .populate('admin_id', 'name email')
      .sort({ created_at: -1 })
      .lean();

    return NextResponse.json({ departments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching departments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, club_id, description } = body;

    if (!name || !name.trim() || !club_id) {
      return NextResponse.json({ message: 'Department name and parent Club are required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const club = await Club.findOne({ _id: club_id, org_id: user.org_id });
    if (!club) {
      return NextResponse.json({ message: 'Club not found in organization' }, { status: 404 });
    }

    const isOrgAdmin = ['orgAdmin', 'superAdmin'].includes(user.role);
    const isClubAdmin = club.admin_id && club.admin_id.toString() === user._id.toString();

    if (isOrgAdmin || isClubAdmin) {
      const department = await Department.create({
        name: name.trim(),
        description: description?.trim() || '',
        club_id: club._id,
        org_id: user.org_id,
        admin_id: user._id,
        status: 'approved',
      });

      return NextResponse.json(
        { message: 'Department created successfully', department },
        { status: 201 }
      );
    } else {
      const approvalRequest = await ApprovalRequest.create({
        type: 'department_creation',
        org_id: user.org_id,
        club_id: club._id,
        requested_by: user._id,
        details: {
          name: name.trim(),
          description: description?.trim() || '',
          club_id: club._id.toString(),
        },
        status: 'pending',
      });

      return NextResponse.json(
        {
          message: 'Department creation request submitted for Club Admin approval',
          approvalRequest,
          requiresApproval: true,
        },
        { status: 202 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error creating department' }, { status: 500 });
  }
}
