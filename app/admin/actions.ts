"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { clearAdminSession, createAdminSession, isAdminAuthConfigured, validateAdminCredentials } from "@/lib/admin-auth";
import { adminLoginSchema } from "@/lib/problem-form-schema";

export type AdminLoginState = {
  error?: string;
};

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  if (!isAdminAuthConfigured()) {
    return {
      error:
        "Admin access is not configured yet. Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET."
    };
  }

  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Unable to sign in."
    };
  }

  const { email, password } = parsed.data;

  if (!validateAdminCredentials(email, password)) {
    return {
      error: "The admin email or password is incorrect."
    };
  }

  await createAdminSession();
  redirect("/admin/problems" as Route);
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin");
}
