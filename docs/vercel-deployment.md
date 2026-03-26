# Vercel Deployment

## Required environment variables

Set these in your Vercel project:

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Use your production Vercel domain for `NEXT_PUBLIC_SITE_URL`, for example:

```bash
NEXT_PUBLIC_SITE_URL=https://problematlas.vercel.app
```

Use the raw PostgreSQL connection string for `DATABASE_URL` with no wrapping braces or quotes:

```bash
DATABASE_URL=postgresql://username:password@host:5432/database?schema=public
```

Do not paste values like these into Vercel:

```bash
DATABASE_URL="postgresql://..."
DATABASE_URL={postgresql://...}
```

## Build behavior

The project is configured to be deployment-safe on Vercel:

- `postinstall` runs `prisma generate`
- `build` runs `prisma generate && next build`
- Prisma CLI reads `prisma.config.ts`
- Vercel uses `npm run vercel-build` through [vercel.json](/C:/Users/NGETICH/ProblemAtlas/vercel.json)

## Database migrations

Production deployments now run migrations automatically before `next build`:

```bash
npm run vercel-build
```

The flow is implemented in [scripts/vercel-build.mjs](/C:/Users/NGETICH/ProblemAtlas/scripts/vercel-build.mjs):

- always runs `prisma generate`
- runs `prisma migrate deploy` only when `VERCEL_ENV=production`
- skips migrations on preview deployments
- runs `next build` after Prisma is ready

You can still run migrations manually when needed:

```bash
npm run prisma:migrate:deploy
```

## Seeding

If you want production seed data:

```bash
npx prisma db seed
```

## Recommended Vercel settings

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: leave as project default from `vercel.json`
- Output directory: leave blank
- Production environment variables:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `ADMIN_SESSION_SECRET`
- Preview environment variables:
  - `DATABASE_URL`
  - `DIRECT_URL` if you want to run Prisma commands manually in preview
  - `NEXT_PUBLIC_SITE_URL`
  - admin variables if you need admin auth in preview

## Notes

- Public metadata and canonical URLs use `NEXT_PUBLIC_SITE_URL` first.
- If that variable is missing, the app falls back to Vercel system URLs when available.
- `DIRECT_URL` should be the non-pooling database connection string used for migrations.
- `DATABASE_URL` should be the pooled runtime connection string when your provider recommends pooling.
