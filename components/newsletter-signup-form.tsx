"use client";

import { useActionState, useEffect, useRef } from "react";
import { signupForNewsletter, type NewsletterSignupState } from "@/app/actions/newsletter";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

type NewsletterSignupFormProps = {
  source: string;
  interests?: string[];
  title?: string;
  description?: string;
  compact?: boolean;
};

const initialState: NewsletterSignupState = {};

export function NewsletterSignupForm({
  source,
  interests = [],
  title = "Get new problem briefs by email",
  description = "Occasional updates on featured problems, editorial picks, and strong new opportunities.",
  compact = false
}: NewsletterSignupFormProps) {
  const [state, formAction, isPending] = useActionState(
    signupForNewsletter,
    initialState
  );
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (!hasSubmittedRef.current || !state.status) {
      return;
    }

    trackEvent("newsletter_signup_submitted", {
      source,
      status: state.status,
      interestsCount: interests.length
    });
  }, [interests.length, source, state.status]);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={() => {
        hasSubmittedRef.current = true;
      }}
    >
      <input type="hidden" name="source" value={source} />
      {interests.map((interest) => (
        <input key={interest} type="hidden" name="interests" value={interest} />
      ))}

      <div className="space-y-2">
        <h3 className="font-serif text-3xl">{title}</h3>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </div>

      <div className={compact ? "grid gap-3" : "grid gap-3 md:grid-cols-[0.7fr_1fr_auto]"}>
        <label className="grid gap-2">
          <span className="sr-only">First name</span>
          <input
            type="text"
            name="firstName"
            autoComplete="given-name"
            placeholder="First name"
            className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
          />
        </label>
        <label className="grid gap-2">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            aria-invalid={state.status === "error"}
            aria-describedby={state.message ? "newsletter-status" : undefined}
            placeholder="Email address"
            className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
          />
        </label>
        <Button type="submit" disabled={isPending} className={compact ? "w-full" : ""}>
          {isPending ? "Joining..." : "Join newsletter"}
        </Button>
      </div>

      {state.message ? (
        <p
          id="newsletter-status"
          aria-live="polite"
          className={
            state.status === "success"
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
