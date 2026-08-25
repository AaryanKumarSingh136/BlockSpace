# Security Policy

## Supported Versions

Security fixes are applied to the latest version on the default branch. Deployments should use the latest dependency lockfile and production build.

## Reporting a Vulnerability

Please do not open a public issue for a suspected vulnerability. Contact the repository maintainer privately through the GitHub profile or repository security advisory workflow:

- Repository: https://github.com/AaryanKumarSingh136/blockspace
- Security advisories: https://github.com/AaryanKumarSingh136/blockspace/security/advisories

Include the affected route or file, impact, reproduction steps, and a suggested mitigation when possible. Remove secrets and personal data from reports.

You can expect an acknowledgement within 7 days. Please allow time for triage and remediation before public disclosure.

## Deployment Hygiene

- Keep `.env.local` and production credentials out of version control.
- Use a unique `NEXTAUTH_SECRET` per environment.
- Restrict MongoDB network access.
- Rotate credentials if logs, tickets, or screenshots expose them.
- Treat reset links, invite links, QR tokens, and API keys as sensitive.
