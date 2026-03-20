"use client";

export type AnalyticsEventName =
  | "problem_card_click"
  | "problem_filters_applied"
  | "newsletter_signup_submitted"
  | "problem_detail_view";

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const ANALYTICS_EVENT_NAME = "problematlas:analytics";

export function trackEvent(eventName: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const event = {
    event: eventName,
    ...payload,
    path: window.location.pathname,
    timestamp: new Date().toISOString()
  };

  window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail: event }));
  window.dataLayer?.push(event);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event);
  }
}

export function getAnalyticsEventName() {
  return ANALYTICS_EVENT_NAME;
}
