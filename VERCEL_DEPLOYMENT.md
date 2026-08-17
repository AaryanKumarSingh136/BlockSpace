# Vercel Deployment Checklist

Use this guide to deploy BlockSpace to Vercel and configure production environment values.

## 1. Import the repository

1. Open Vercel.
2. Import the `BlockSpace` GitHub repository.
3. Choose the `main` or default branch.

## 2. Add environment variables

Add these values in the Vercel dashboard under Settings > Environment Variables.

Required variables:

- `MONGODB_URI` — MongoDB Atlas connection string
- `NEXTAUTH_URL` — Vercel app URL, e.g. `https://your-app.vercel.app`
- `NEXTAUTH_SECRET` — strong secret for NextAuth
- `RESEND_API_KEY` — Resend API key for transactional email delivery
- `SENTRY_DSN` — Sentry DSN for error tracking

Optional variables:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_SOCKET_URL`
- `ADMIN_EMAIL` — email used by the seed admin script
- `ADMIN_PASSWORD` — password used by the seed admin script

## 3. Update MongoDB Atlas network access

1. In MongoDB Atlas, open Network Access.
2. Add the Vercel IP ranges used for outgoing connections.
3. Allow access from the Vercel deployment region.

## 4. Configure build and output settings

- Build command: `npm run build`
- Install command: `npm install`
- Output directory: `.`

## 5. Deploy

1. Trigger a deployment from Vercel.
2. Confirm the deployment completes successfully.
3. Browse the live site and verify key pages.

## 6. Post-deploy checks

- Confirm `NEXTAUTH_URL` is set to the live Vercel URL.
- Confirm `SENTRY_DSN` is valid and errors appear in Sentry.
- Confirm emails are sending through Resend by testing signup or invite flows.
- Confirm mobile layout at `375px` width in browser dev tools.
