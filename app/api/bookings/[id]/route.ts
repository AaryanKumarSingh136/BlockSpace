import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { sendBookingStatusEmail } from '@/lib/email';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user?.org_id || !['manager', 'orgAdmin', 'superAdmin'].includes(user.role)) {
      return NextResponse.json({ message: 'Only managers or admins can update bookings' }, { status: 403 });
    }

    const { status } = await req.json();
    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const { id } = await params;
    const booking = await Booking.findOneAndUpdate(
      { _id: id, org_id: user.org_id },
      { status },
      { new: true }
    ).populate('user_id', 'email name');

    if (!booking) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    // Send email notification to booking owner
    if ((booking.user_id as any)?.email) {
      sendBookingStatusEmail(
        (booking.user_id as any).email,
        booking.title,
        status
      ).catch((err) => console.warn('Status email error:', err));
    }

    // ── REAL-TIME SOCKET BROADCAST ──────────────────────────────────
    if ((global as any).io) {
      const room = `org_${user.org_id.toString()}`;
      (global as any).io.to(room).emit('resource-updated', {
        org_id: user.org_id.toString(),
        resource_id: booking.resource_id.toString(),
        action: `booking_${status}`,
        booking,
      });
    }

    return NextResponse.json({ message: 'Booking updated', booking });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Something went wrong', error }, { status: 500 });
  }
}