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

Use your MongoDB Atlas connection string for `DATABASE_URL` with no wrapping braces:

```bash
DATABASE_URL=mongodb+srv://username:password@cluster0.example.mongodb.net/problematlas?retryWrites=true&w=majority
```

Do not paste values like these into Vercel:

```bash
DATABASE_URL="mongodb+srv://..."
DATABASE_URL={mongodb+srv://...}
```

## Build behavior

The project is configured to be deployment-safe on Vercel:

- `postinstall` runs `prisma generate`
- `build` runs `prisma generate && next build`
- Prisma CLI reads `prisma.config.ts`
- Vercel uses `npm run vercel-build` through [vercel.json](/C:/Users/NGETICH/ProblemAtlas/vercel.json)

## Schema sync

MongoDB deployments use Prisma schema sync instead of SQL migrations.

By default, Vercel builds do **not** run `prisma db push`. This avoids build failures when Atlas network access or TLS prevents schema sync during the build step.

```bash
npm run vercel-build
```

The flow is implemented in [scripts/vercel-build.mjs](/C:/Users/NGETICH/ProblemAtlas/scripts/vercel-build.mjs):

- always runs `prisma generate`
- runs `prisma db push` only when both:
  - `VERCEL_ENV=production`
  - `PRISMA_DB_PUSH_ON_BUILD=true`
- skips schema sync otherwise
- runs `next build` after Prisma is ready

You can still sync manually when needed:

```bash
npm run prisma:push
```

If you intentionally want Vercel to push the schema during production builds, add:

```bash
PRISMA_DB_PUSH_ON_BUILD=true
```

Otherwise, leave it unset.

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
  - `NEXT_PUBLIC_SITE_URL`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `ADMIN_SESSION_SECRET`
  - `PRISMA_DB_PUSH_ON_BUILD` optional, only if you explicitly want schema sync on build
- Preview environment variables:
  - `DATABASE_URL` if preview deployments should read real data
  - `NEXT_PUBLIC_SITE_URL` optional
  - admin variables if you need admin auth in preview

## Notes

- Public metadata and canonical URLs use `NEXT_PUBLIC_SITE_URL` first.
- If that variable is missing, the app falls back to Vercel system URLs when available.
- MongoDB Atlas connection strings should come from an Atlas replica set or sharded cluster.
