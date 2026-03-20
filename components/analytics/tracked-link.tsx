"use client";

import type { Route } from "next";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type TrackedLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href: Route;
  eventName: "problem_card_click";
  eventPayload: Record<string, string | number | boolean | null | undefined>;
  children: ReactNode;
};

export function TrackedLink({
  eventName,
  eventPayload,
  onClick,
  children,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackEvent(eventName, eventPayload);
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
