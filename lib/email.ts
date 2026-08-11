import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const isDummyKey = !resendApiKey || resendApiKey.includes('placeholder') || resendApiKey === 're_123456789_placeholder';
const resend = isDummyKey ? null : new Resend(resendApiKey);

const FROM_EMAIL = 'Blockspace Notifications <onboarding@resend.dev>';

async function dispatchEmail(payload: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log(`[SIMULATED EMAIL] To: ${payload.to} | Subject: "${payload.subject}"`);
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    });

    if (error) {
      console.warn('Resend email error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.warn('Resend exception:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <div style="font-family: sans-serif; background-color: #090d16; color: #ffffff; padding: 32px; borderRadius: 12px;">
      <h2 style="color: #6366f1;">Welcome to Blockspace, ${name}!</h2>
      <p style="color: #9ca3af;">Thank you for joining Blockspace SaaS. You can now manage multi-tenant bookings, create events, and access live resource availability.</p>
      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">Go to Dashboard</a>
    </div>
  `;
  return dispatchEmail({ to, subject: 'Welcome to Blockspace!', html });
}

export async function sendBookingCreatedEmail(to: string, bookingTitle: string, resourceName: string, startTime: string) {
  const html = `
    <div style="font-family: sans-serif; background-color: #090d16; color: #ffffff; padding: 32px; borderRadius: 12px;">
      <h2 style="color: #10b981;">Booking Confirmation Received</h2>
      <p style="color: #9ca3af;">Your reservation request for <strong>${bookingTitle}</strong> has been submitted.</p>
      <div style="background-color: #111827; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0; color: #e5e7eb;"><strong>Resource:</strong> ${resourceName}</p>
        <p style="margin: 4px 0; color: #e5e7eb;"><strong>Start Time:</strong> ${new Date(startTime).toLocaleString()}</p>
      </div>
    </div>
  `;
  return dispatchEmail({ to, subject: `Booking Received: ${bookingTitle}`, html });
}

export async function sendBookingStatusEmail(to: string, bookingTitle: string, status: string) {
  const statusColor = status === 'approved' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
  const html = `
    <div style="font-family: sans-serif; background-color: #090d16; color: #ffffff; padding: 32px; borderRadius: 12px;">
      <h2 style="color: ${statusColor}; font-capitalize: true;">Booking ${status.toUpperCase()}</h2>
      <p style="color: #9ca3af;">Your booking for <strong>${bookingTitle}</strong> status has been updated to <strong style="color: ${statusColor};">${status}</strong>.</p>
    </div>
  `;
  return dispatchEmail({ to, subject: `Booking Update: ${bookingTitle} is ${status}`, html });
}

export async function sendEventRegistrationEmail(to: string, eventTitle: string, qrToken: string) {
  const html = `
    <div style="font-family: sans-serif; background-color: #090d16; color: #ffffff; padding: 32px; borderRadius: 12px;">
      <h2 style="color: #6366f1;">Registered for ${eventTitle}!</h2>
      <p style="color: #9ca3af;">You are registered for <strong>${eventTitle}</strong>. Your QR Entry Pass code is attached below:</p>
      <div style="background-color: #111827; padding: 16px; border-radius: 8px; margin: 16px 0; word-break: break-all; font-family: monospace; color: #818cf8;">
        ${qrToken}
      </div>
      <p style="color: #9ca3af; font-size: 12px;">Present this token or QR code at venue check-in.</p>
    </div>
  `;
  return dispatchEmail({ to, subject: `Event Ticket: ${eventTitle}`, html });
}

export async function sendWaitlistPromotedEmail(to: string, eventTitle: string) {
  const html = `
    <div style="font-family: sans-serif; background-color: #090d16; color: #ffffff; padding: 32px; borderRadius: 12px;">
      <h2 style="color: #f59e0b;">You're In! Waitlist Spot Available</h2>
      <p style="color: #9ca3af;">A spot opened up for <strong>${eventTitle}</strong> and you have been automatically promoted from the waitlist to attendee!</p>
      <p style="color: #9ca3af;">Your QR Ticket has been issued for entry.</p>
    </div>
  `;
  return dispatchEmail({ to, subject: `Waitlist Promotion: You're attending ${eventTitle}!`, html });
}

export async function sendOrgInviteEmail(to: string, inviteLink: string, orgName: string) {
  const html = `
    <div style="font-family: sans-serif; background-color: #090d16; color: #ffffff; padding: 32px; borderRadius: 12px;">
      <h2 style="color: #6366f1;">You're Invited to join ${orgName}</h2>
      <p style="color: #9ca3af;">You have been invited to join <strong>${orgName}</strong> on Blockspace.</p>
      <a href="${inviteLink}" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px;">Accept Invitation</a>
    </div>
  `;
  return dispatchEmail({ to, subject: `Invitation to join ${orgName} on Blockspace`, html });
}
