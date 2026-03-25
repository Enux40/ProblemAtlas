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

## Database migrations

Apply migrations to production before or during your release process:

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
- Build command: leave default or use `npm run build`
- Output directory: leave blank

## Notes

- Public metadata and canonical URLs use `NEXT_PUBLIC_SITE_URL` first.
- If that variable is missing, the app falls back to Vercel system URLs when available.
