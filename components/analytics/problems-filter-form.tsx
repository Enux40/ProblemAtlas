"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

type ProblemsFilterFormProps = {
  children: ReactNode;
};

export function ProblemsFilterForm({ children }: ProblemsFilterFormProps) {
  return (
    <form
      className="space-y-5"
      method="get"
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const payload = {
          query: String(formData.get("q") ?? "").trim() || null,
          category: String(formData.get("category") ?? "").trim() || null,
          skill: String(formData.get("skill") ?? "").trim() || null,
          projectType: String(formData.get("projectType") ?? "").trim() || null,
          demand: String(formData.get("demand") ?? "").trim() || null,
          buildTime: String(formData.get("buildTime") ?? "").trim() || null,
          sort: String(formData.get("sort") ?? "").trim() || "featured"
        };

        trackEvent("problem_filters_applied", payload);
      }}
    >
      {children}
    </form>
  );
}
