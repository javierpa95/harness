# Deployment Guide — [PROJECT_NAME]

## Infrastructure

- **Hosting**: [PLATFORM — Coolify, Vercel, Railway, AWS, etc.]
- **Frontend**: [FRAMEWORK] — [SSG/SSR/SPA]
- **Backend**: [TECHNOLOGY] — [Description]

## Environment Variables

See `config/.env.example` for required variables.

### Production

```env
# Copy from config/.env.example and fill with production values
# DATABASE_URL=
# API_URL=
# AUTH_SECRET=
# NODE_ENV=production
```

## [PLATFORM] Setup

### 1. Backend Service

- Image/Stack: [Details]
- Port: [PORT]
- Persistent storage: [Path]
- Environment: [Variables]

### 2. Frontend Service

- Build command: [e.g., `npm run build`]
- Output: [e.g., `dist/` directory]
- Port: [PORT]
- Environment: [Variables]

## Domain Configuration

- Main domain: `your-domain.com` → Frontend
- API subdomain (optional): `api.your-domain.com` → Backend

## SSL

- [Platform] handles SSL automatically via Let's Encrypt
- Ensure domain DNS points to the correct IP

## Backup

- Backend: Backup database/data directory regularly
- Frontend: No backup needed (regenerable from repo)
