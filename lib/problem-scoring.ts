export const SCORE_MIN = 1;
export const SCORE_MAX = 5;

export const scoringDimensions = [
  "demand",
  "urgency",
  "monetization",
  "difficulty",
  "saturation",
  "portfolio",
  "practice"
] as const;

export type ScoringDimension = (typeof scoringDimensions)[number];

export type ProblemScoreSet = Record<ScoringDimension, number>;

export type ScorePresentation = {
  value: number;
  label: string;
  guidance: string;
};

export type ScoreSummary = {
  labels: string[];
  notes: string[];
};

const dimensionCopy: Record<
  ScoringDimension,
  Record<number, { label: string; guidance: string }>
> = {
  demand: {
    1: {
      label: "Limited demand",
      guidance: "Feels niche or sporadic rather than consistently present."
    },
    2: {
      label: "Some demand",
      guidance: "Shows up occasionally, but not as a repeatable pain for many teams."
    },
    3: {
      label: "Visible demand",
      guidance: "A real problem with credible demand, though not obviously widespread."
    },
    4: {
      label: "Strong demand",
      guidance: "Appears often enough to justify serious product exploration."
    },
    5: {
      label: "Broad demand",
      guidance: "Common, recurring, and easy to spot across many operators or teams."
    }
  },
  urgency: {
    1: {
      label: "Low urgency",
      guidance: "Annoying, but unlikely to force immediate action or budget."
    },
    2: {
      label: "Mild urgency",
      guidance: "Pain is real, but teams can often tolerate it for a while."
    },
    3: {
      label: "Moderate urgency",
      guidance: "Worth solving, especially when it slows important workflows."
    },
    4: {
      label: "High urgency",
      guidance: "Costly enough that buyers may actively look for relief."
    },
    5: {
      label: "Critical urgency",
      guidance: "Pain is immediate, expensive, or operationally hard to ignore."
    }
  },
  monetization: {
    1: {
      label: "Hard to monetize",
      guidance: "Value may be real, but willingness to pay is weak or indirect."
    },
    2: {
      label: "Monetization unclear",
      guidance: "There may be buyer value here, but pricing confidence is limited."
    },
    3: {
      label: "Plausible monetization",
      guidance: "A workable paid offer seems realistic with the right wedge."
    },
    4: {
      label: "Strong monetization",
      guidance: "Clear budget logic or commercial upside makes charging more straightforward."
    },
    5: {
      label: "Very monetizable",
      guidance: "Strong willingness to pay is likely if execution is credible."
    }
  },
  difficulty: {
    1: {
      label: "Very buildable",
      guidance: "A focused MVP should be accessible even with modest experience."
    },
    2: {
      label: "Beginner-friendly",
      guidance: "Still approachable, with a few moving parts but manageable scope."
    },
    3: {
      label: "Moderate build",
      guidance: "Reasonable project complexity for a thoughtful MVP."
    },
    4: {
      label: "Challenging build",
      guidance: "Likely needs stronger product judgment, technical depth, or integrations."
    },
    5: {
      label: "Complex build",
      guidance: "Hard to execute well without significant experience or narrow scoping."
    }
  },
  saturation: {
    1: {
      label: "Open field",
      guidance: "The solution space looks relatively uncrowded."
    },
    2: {
      label: "Light competition",
      guidance: "Some alternatives exist, but the category still feels open."
    },
    3: {
      label: "Moderate competition",
      guidance: "There are already known players, so positioning matters."
    },
    4: {
      label: "Crowded market",
      guidance: "Many products are already visible, raising the bar for differentiation."
    },
    5: {
      label: "Very saturated",
      guidance: "Breaking through will likely be difficult without a sharp niche."
    }
  },
  portfolio: {
    1: {
      label: "Limited portfolio signal",
      guidance: "Useful practice, but unlikely to stand out much on its own."
    },
    2: {
      label: "Some portfolio value",
      guidance: "Shows initiative, though the story may still feel fairly basic."
    },
    3: {
      label: "Solid portfolio piece",
      guidance: "Demonstrates practical product thinking and implementation skill."
    },
    4: {
      label: "Strong portfolio project",
      guidance: "A good showcase for product judgment, UX, and real-world constraints."
    },
    5: {
      label: "Standout portfolio piece",
      guidance: "Likely to tell a compelling story about execution and decision-making."
    }
  },
  practice: {
    1: {
      label: "Narrow practice value",
      guidance: "Teaches something, but the learning surface is fairly limited."
    },
    2: {
      label: "Useful practice",
      guidance: "Good for reinforcing a few skills without much range."
    },
    3: {
      label: "Strong practice project",
      guidance: "Covers enough scope to make the build educational."
    },
    4: {
      label: "Excellent practice value",
      guidance: "A strong way to sharpen product, UX, and implementation skills."
    },
    5: {
      label: "Practice-first project",
      guidance: "Rich learning surface with lots of useful tradeoffs and decisions."
    }
  }
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error("Scores must be finite numbers.");
  }

  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, Math.round(value)));
}

export function normalizeScore(value: number) {
  return clampScore(value);
}

export function getScorePresentation(
  dimension: ScoringDimension,
  value: number
): ScorePresentation {
  const normalized = clampScore(value);
  const copy = dimensionCopy[dimension][normalized];

  return {
    value: normalized,
    label: copy.label,
    guidance: copy.guidance
  };
}

export function summarizeProblemScores(scores: ProblemScoreSet): ScoreSummary {
  const normalized = Object.fromEntries(
    scoringDimensions.map((dimension) => [dimension, clampScore(scores[dimension])])
  ) as ProblemScoreSet;

  const labels = new Set<string>();
  const notes: string[] = [];

  if (normalized.difficulty <= 2 && normalized.practice >= 4) {
    labels.add("Great for beginners");
    notes.push("Accessible build with strong learning value.");
  }

  if (normalized.monetization >= 4 && normalized.urgency >= 4) {
    labels.add("Strong freelance opportunity");
    notes.push("Pain looks costly enough that service-led work could be credible.");
  }

  if (normalized.monetization >= 4 && normalized.saturation <= 3) {
    labels.add("Good micro-SaaS candidate");
    notes.push("Commercial upside looks real without an obviously closed market.");
  }

  if (normalized.practice >= 4 && normalized.portfolio >= 4) {
    labels.add("Standout learning project");
    notes.push("Good fit for someone who wants both growth and a strong case study.");
  }

  if (normalized.practice >= 4 && normalized.monetization <= 2) {
    labels.add("Practice-first project");
    notes.push("Probably stronger as a learning build than an immediate business bet.");
  }

  if (normalized.saturation >= 4 && normalized.demand >= 4) {
    labels.add("Crowded but valuable");
    notes.push("The market is busy, but the pain still appears real.");
  }

  if (normalized.urgency >= 4 && normalized.monetization <= 2) {
    labels.add("Strong pain, weak monetization");
    notes.push("People may care a lot, but paid distribution could still be difficult.");
  }

  if (normalized.portfolio >= 4 && normalized.difficulty >= 4) {
    labels.add("Ambitious portfolio build");
    notes.push("Impressive if shipped well, but not the easiest route to a quick win.");
  }

  if (labels.size === 0) {
    if (normalized.demand >= 4) {
      labels.add("Worth exploring");
      notes.push("Demand looks healthy enough to justify deeper validation.");
    } else if (normalized.practice >= 4) {
      labels.add("Useful practice project");
      notes.push("Good learning value even if the business case is still mixed.");
    } else {
      labels.add("Directional opportunity");
      notes.push("Potential is real, but the signal is better read qualitatively than as a verdict.");
    }
  }

  return {
    labels: Array.from(labels),
    notes
  };
}

export function presentProblemScores(scores: ProblemScoreSet) {
  return {
    dimensions: Object.fromEntries(
      scoringDimensions.map((dimension) => [
        dimension,
        getScorePresentation(dimension, scores[dimension])
      ])
    ) as Record<ScoringDimension, ScorePresentation>,
    summary: summarizeProblemScores(scores)
  };
}
