# BlockSpace

BlockSpace is a multi-tenant SaaS booking platform built with Next.js 16, MongoDB, TypeScript, and Socket.io.

## Live Deployment

- Live demo: _Add Vercel deployment URL here once imported to GitHub_

## Production-Ready Features

- Email delivery via Resend for onboarding, booking confirmations, approvals/rejections, event registration, waitlist promotions, and organization invites
- Error monitoring with Sentry in production
- Rate limiting on authentication routes to prevent brute-force attacks
- Global error boundary and 404 page for better user experience
- Loading and empty states across data-driven pages
- Mobile-first UI optimized for small screens

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/<your-org>/BlockSpace.git
cd BlockSpace
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file:

```bash
copy .env.example .env.local
```

4. Update `.env.local` with your production values.

5. Optionally create a local test admin account with the seed script:

```bash
npm run seed-admin
```

Use `npm run seed-admin admin@blockspace.test Admin123!` to control the test admin email and password.

6. Run the app locally:

```bash
npm run dev
```

## Required Environment Variables

- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_URL` — Application URL (e.g. `http://localhost:3000` locally, Vercel URL in production)
- `NEXTAUTH_SECRET` — NextAuth session encryption secret
- `RESEND_API_KEY` — Resend API key for transactional email delivery
- `SENTRY_DSN` — Sentry DSN for error tracking

## Optional Environment Variables

- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name for branding uploads
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret
- `NEXT_PUBLIC_SOCKET_URL` — Socket URL if using an external socket host

## Deployment Checklist for Vercel

1. Import the GitHub repository into Vercel.
2. Add the environment variables listed above to the Vercel dashboard.
3. Set `NEXTAUTH_URL` to the Vercel app URL.
4. Add the Vercel outgoing IP addresses to MongoDB Atlas network access.
5. Deploy and verify the live site.

## Additional Notes

- The app uses `@sentry/nextjs` for runtime error monitoring and source map upload on build.
- `RESEND_API_KEY` is required for email notifications. Local simulated email logs are used when the key is missing.
- `app/not-found.tsx` and `app/error.tsx` are implemented for 404 and global runtime failures.
- For mobile testing, confirm pages render cleanly at `375px` width in browser dev tools.
