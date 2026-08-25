# Contributing to Blockspace

Thank you for helping improve Blockspace. Contributions should make the product calmer, clearer, safer, or more useful for organizations managing shared spaces.

## Before You Start

1. Search existing issues and pull requests.
2. Open an issue for substantial features or behavior changes.
3. Keep pull requests focused on one coherent change.
4. Never include credentials, tokens, private URLs, or `.env.local` content.

## Local Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `MONGODB_URI`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` before using authenticated flows. See the README for all optional integrations.

## Development Standards

- Use TypeScript for application code.
- Follow the existing App Router and component patterns.
- Preserve organization-level authorization on API routes.
- Validate request input at the route boundary.
- Keep UI accessible with labels, keyboard support, and reduced-motion behavior.
- Prefer semantic theme tokens over hardcoded colors.
- Avoid unrelated formatting or dependency changes.

## Validation

Run the relevant checks before opening a pull request:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

For changes involving authentication, organizations, events, bookings, or public endpoints, manually verify both an authorized and unauthorized request path.

## Pull Requests

Include:

- What changed and why.
- Screens or routes affected.
- Security and authorization implications.
- Validation commands and results.
- Screenshots or a short recording for meaningful UI changes.

A maintainer may ask for tests, documentation, or a smaller change boundary before merging.

## Commit Messages

Use concise imperative messages, for example:

- `Add organization invite expiry check`
- `Improve availability card states`
- `Document production socket setup`

## Reporting Security Issues

Do not disclose exploitable vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md).
