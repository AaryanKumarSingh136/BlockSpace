import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { v2 as cloudinary } from 'cloudinary';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '1234567890',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'sample_secret',
});

export async function POST(req: Request) {
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

    if (!['orgAdmin', 'superAdmin'].includes(user.role)) {
      return NextResponse.json({ message: 'Only Org Admins can update branding' }, { status: 403 });
    }

    const { accent_color, logo_url, logo_file } = await req.json();

    let finalLogoUrl = logo_url;

    // Handle Cloudinary image upload if base64/file provided
    if (logo_file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(logo_file, {
          folder: 'blockspace_org_logos',
          resource_type: 'image',
        });
        if (uploadResult?.secure_url) {
          finalLogoUrl = uploadResult.secure_url;
        }
      } catch (cloudErr: any) {
        console.warn('Cloudinary upload error, using direct image data fallback:', cloudErr.message);
        // Fallback to storing image url or base64 string directly
        if (!finalLogoUrl && logo_file.startsWith('data:image')) {
          finalLogoUrl = logo_file;
        }
      }
    }

    const updateFields: any = {};
    if (accent_color) updateFields.accent_color = accent_color;
    if (finalLogoUrl !== undefined) updateFields.logo_url = finalLogoUrl;

    const organization = await Organization.findByIdAndUpdate(
      user.org_id,
      { $set: updateFields },
      { new: true }
    );

    return NextResponse.json(
      {
        message: 'Organization branding updated successfully',
        organization: {
          name: organization?.name,
          slug: organization?.slug,
          logo_url: organization?.logo_url,
          accent_color: organization?.accent_color,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error updating branding' },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    const organization = await Organization.findById(user.org_id).lean();

    return NextResponse.json(
      {
        organization: organization
          ? {
              name: organization.name,
              slug: organization.slug,
              logo_url: organization.logo_url || '',
              accent_color: organization.accent_color || '#6366F1',
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Error fetching organization branding' },
      { status: 500 }
    );
  }
}
