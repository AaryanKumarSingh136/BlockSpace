# Blockspace

Enterprise-grade multi-tenant resource and event management platform. Centralize bookings, manage complex organizational hierarchies, and scale seamlessly with real-time collaboration.

## Features

- **Multi-tenant Architecture** - Complete data isolation with organization-level granularity
- **Real-Time Collaboration** - WebSocket-powered live updates across resource availability and bookings
- **Advanced Event Management** - Create public events, manage capacity, handle waitlists, and issue QR code tickets
- **Resource Booking** - Calendar-based booking with conflict detection and approval workflows
- **Hierarchical Organization** - Support for departments, clubs, and nested structures
- **Analytics Dashboard** - Real-time insights into bookings, attendance, resource utilization, and peak hours
- **Email Notifications** - Resend-powered transactional emails for signups, booking updates, and event registrations
- **Error Monitoring** - Sentry integration for production error tracking
- **Security** - Rate-limited authentication, bcrypt password hashing, JWT sessions, MongoDB transaction support
- **Mobile Responsive** - Optimized for all screen sizes with Tailwind CSS

## Tech Stack

- **Frontend** - Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn UI
- **Backend** - Next.js API Routes, NextAuth for auth, Node.js
- **Database** - MongoDB with Mongoose ODM
- **Real-Time** - Socket.io for live updates
- **Email** - Resend for transactional emails
- **Monitoring** - Sentry for error tracking
- **Hosting** - Vercel (recommended)

## Quick Start

1. **Clone and install:**

```bash
git clone https://github.com/<your-org>/BlockSpace.git
cd BlockSpace
npm install
```

2. **Set up environment:**

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

3. **Create admin account (optional):**

```bash
npm run seed-admin [email] [password]
# Default: admin@blockspace.test / Admin123!
```

4. **Run locally:**

```bash
npm run dev
# Open http://localhost:3000
```

## Environment Variables

### Required

- `MONGODB_URI` - MongoDB Atlas connection string
- `NEXTAUTH_URL` - Application URL (http://localhost:3000 locally)
- `NEXTAUTH_SECRET` - Random 32+ character secret for session encryption

### Email & Monitoring

- `RESEND_API_KEY` - Get from resend.com
- `SENTRY_DSN` - Get from sentry.io (optional, errors still logged locally)

### Optional

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - For organization branding
- `NEXT_PUBLIC_SOCKET_URL` - WebSocket server URL (default: localhost:3000)

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Create new project in Vercel
3. Import your repository
4. Add environment variables in project settings
5. Deploy

### Production Checklist

- Set `NEXTAUTH_URL` to your domain
- Add real Sentry DSN for error monitoring
- Update MongoDB Atlas network access with Vercel IP ranges
- Configure custom domain (optional)
- Enable HTTPS (automatic on Vercel)
- Test signup flow to verify Resend email delivery

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.

## Architecture

### Pages

- `/` - Marketing homepage
- `/sign-in`, `/sign-up` - Authentication
- `/dashboard` - User overview and quick links
- `/availability` - Real-time resource status and booking
- `/bookings` - Manage your reservations
- `/events` - Create and manage events
- `/hierarchy` - Organizational structure (departments, clubs)
- `/analytics` - Usage insights and metrics
- `/settings/branding` - Organization customization
- `/admin` - Super admin controls
- `/org/[slug]` - Public organization page
- `/join` - Accept organization invites

### API Routes

- `/api/auth/*` - NextAuth credentials provider with rate limiting
- `/api/bookings` - Create, read, update reservations
- `/api/events` - Manage events and registrations
- `/api/organizations` - Org management and invites
- `/api/public/events/[slug]/*` - Public event registration and waitlist
- `/api/analytics/*` - Usage data endpoints

### Database Models

- **User** - Authentication and role assignment
- **Organization** - Multi-tenant root entity
- **Department** - Org hierarchy
- **Club** - Secondary grouping
- **Resource** - Bookable items (rooms, equipment)
- **Booking** - Resource reservations with approval workflow
- **Event** - Public or private events with attendees
- **Ticket** - Event registration with QR code
- **Invite** - Organization invitations

## Development

### Run dev server

```bash
npm run dev
```

### Build for production

```bash
npm build
```

### Seed admin account

```bash
npm run seed-admin
# Or with custom credentials:
npm run seed-admin yourname@company.com YourPassword123!
```

### Lint

```bash
npm run lint
```

## Security & Performance

- Rate limiting on `/api/auth/*` endpoints (10 requests per 15 minutes per IP)
- Password hashing with bcryptjs
- JWT-based session management
- MongoDB transactions for booking atomicity
- Real-time conflict detection
- CORS configured for production domains
- Source maps hidden in production (Sentry)

## Email Notifications

Automated emails for:
- Welcome on signup
- Booking confirmation received
- Booking approved/rejected
- Event registration with QR token
- Waitlist promotion when spots open
- Organization invite

Emails are simulated (logged to console) if `RESEND_API_KEY` is not set.

## Error Handling

- Global error boundary (`app/error.tsx`) for runtime errors
- 404 page (`app/not-found.tsx`) for missing routes
- Sentry integration captures errors in production
- Rate limiting prevents abuse
- Input validation on all API endpoints

## Testing

Recommended test user credentials (after seed-admin):
- Email: `admin@blockspace.test`
- Password: `Admin123!`
- Role: Super Admin

Or create a new account at `/sign-up`.

## Screenshots

Add screenshots here:
- Homepage hero
- Dashboard overview
- Event management
- Analytics dashboard
- Resource booking calendar

## Support

- Issues: [GitHub Issues](https://github.com/<your-org>/BlockSpace/issues)
- Discussions: [GitHub Discussions](https://github.com/<your-org>/BlockSpace/discussions)

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] Payment processing (Stripe integration)
- [ ] Advanced reporting (PDF exports)
- [ ] Mobile apps (React Native)
- [ ] API authentication for integrations
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Resource resource templates
- [ ] Bulk operations
- [ ] Custom fields per organization

---

Built with next.js, MongoDB, and real-time WebSockets. Deploy anywhere, scale everywhere.
