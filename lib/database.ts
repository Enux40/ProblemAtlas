import { Prisma } from "@prisma/client";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function isDatabaseAccessError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  return error instanceof Error && /DATABASE_URL|Can't reach database server|Prisma/.test(error.message);
}

export async function withDatabaseFallback<T>(
  query: () => Promise<T>,
  fallback: T
): Promise<{ data: T; unavailable: boolean }> {
  if (!isDatabaseConfigured()) {
    return {
      data: fallback,
      unavailable: true
    };
  }

  try {
    return {
      data: await query(),
      unavailable: false
    };
  } catch (error) {
    if (isDatabaseAccessError(error)) {
      return {
        data: fallback,
        unavailable: true
      };
    }

    throw error;
  }
}
