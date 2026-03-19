import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "problematlas_admin_session";

function getAdminConfig() {
  return {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    sessionSecret: process.env.ADMIN_SESSION_SECRET
  };
}

function createSignature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeCompare(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
}

export function isAdminAuthConfigured() {
  const config = getAdminConfig();
  return Boolean(config.email && config.password && config.sessionSecret);
}

export async function createAdminSession() {
  const config = getAdminConfig();

  if (!config.email || !config.sessionSecret) {
    throw new Error("Admin auth is not fully configured.");
  }

  const payload = config.email;
  const signature = createSignature(payload, config.sessionSecret);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function isAdminAuthenticated() {
  const config = getAdminConfig();

  if (!config.email || !config.sessionSecret) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!session) {
    return false;
  }

  const [payload, signature] = session.split(".");

  if (!payload || !signature || payload !== config.email) {
    return false;
  }

  const expectedSignature = createSignature(payload, config.sessionSecret);
  return safeCompare(signature, expectedSignature);
}

export async function requireAdmin() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin");
  }
}

export function validateAdminCredentials(email: string, password: string) {
  const config = getAdminConfig();

  if (!config.email || !config.password) {
    return false;
  }

  return email === config.email && safeCompare(password, config.password);
}
