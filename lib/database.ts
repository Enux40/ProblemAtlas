import { Prisma } from "@prisma/client";

function normalizeDatabaseUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const withoutBraces =
    trimmed.startsWith("{") && trimmed.endsWith("}") ? trimmed.slice(1, -1) : trimmed;
  const unquoted =
    (withoutBraces.startsWith('"') && withoutBraces.endsWith('"')) ||
    (withoutBraces.startsWith("'") && withoutBraces.endsWith("'"))
      ? withoutBraces.slice(1, -1)
      : withoutBraces;

  return unquoted.trim();
}

export function isDatabaseConfigured() {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
  return Boolean(
    databaseUrl &&
      (databaseUrl.startsWith("postgresql://") ||
        databaseUrl.startsWith("postgres://") ||
        databaseUrl.startsWith("mongodb://") ||
        databaseUrl.startsWith("mongodb+srv://"))
  );
}

export function isDatabaseAccessError(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P1001", "P2010", "P2021", "P2022"].includes(error.code)
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  return (
    error instanceof Error &&
    /DATABASE_URL|Can't reach database server|Server selection timeout|ReplicaSetNoPrimary|received fatal alert|MongoDB error|Prisma/.test(
      error.message
    )
  );
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
