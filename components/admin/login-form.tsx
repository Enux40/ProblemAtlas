"use client";

import { useActionState } from "react";
import type { AdminLoginState } from "@/app/admin/actions";
import { loginAdmin } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminLoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <label className="grid gap-2">
        <span className="text-sm font-medium">Admin email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
          placeholder="admin@example.com"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
          placeholder="Enter your admin password"
        />
      </label>

      {state.error ? (
        <p
          aria-live="polite"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
