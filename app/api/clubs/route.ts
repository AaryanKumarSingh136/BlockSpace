import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Club from '@/models/Club';
import Department from '@/models/Department';
import User from '@/models/User';
import ApprovalRequest from '@/models/ApprovalRequest';

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const clubs = await Club.find({ org_id: user.org_id })
      .populate('admin_id', 'name email')
      .sort({ created_at: -1 })
      .lean();

    // Include department counts for each club
    const clubsWithDepts = await Promise.all(
      clubs.map(async (club) => {
        const deptCount = await Department.countDocuments({ club_id: club._id });
        return { ...club, department_count: deptCount };
      })
    );

    return NextResponse.json({ clubs: clubsWithDepts }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error fetching clubs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Club name is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.org_id) {
      return NextResponse.json({ message: 'Organization required' }, { status: 400 });
    }

    const isAdmin = ['orgAdmin', 'superAdmin'].includes(user.role);

    if (isAdmin) {
      // Direct creation for Org Admins
      const club = await Club.create({
        name: name.trim(),
        description: description?.trim() || '',
        org_id: user.org_id,
        admin_id: user._id,
        status: 'approved',
      });

      return NextResponse.json(
        { message: 'Club created successfully', club },
        { status: 201 }
      );
    } else {
      // Create approval request for non-admins
      const approvalRequest = await ApprovalRequest.create({
        type: 'club_creation',
        org_id: user.org_id,
        requested_by: user._id,
        details: {
          name: name.trim(),
          description: description?.trim() || '',
        },
        status: 'pending',
      });

      return NextResponse.json(
        {
          message: 'Club creation request submitted for Org Admin approval',
          approvalRequest,
          requiresApproval: true,
        },
        { status: 202 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Error creating club' }, { status: 500 });
  }
}
