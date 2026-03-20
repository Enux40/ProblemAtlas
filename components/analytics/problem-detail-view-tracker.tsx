"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

type ProblemDetailViewTrackerProps = {
  slug: string;
  title: string;
  category: string;
};

export function ProblemDetailViewTracker({
  slug,
  title,
  category
}: ProblemDetailViewTrackerProps) {
  useEffect(() => {
    trackEvent("problem_detail_view", {
      slug,
      title,
      category
    });
  }, [category, slug, title]);

  return null;
}
