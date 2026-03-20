import type { ProjectType } from "@prisma/client";
import { formatEnumLabel } from "@/lib/problem-presenters";

type RelatedProblemBase = {
  id: string;
  category: string;
  projectTypes: ProjectType[];
  demandScore: number;
  difficultyScore: number;
  monetizationScore: number;
  tags: Array<{
    id: string;
    name: string;
  }>;
};

type RelatedProblemCandidate = RelatedProblemBase & {
  slug: string;
  title: string;
  excerpt: string;
};

export type RelatedProblemMatch = RelatedProblemCandidate & {
  matchScore: number;
  matchReasons: string[];
};

function getSharedItems<T>(left: T[], right: T[]) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
}

function getScoreSimilarityBonus(base: RelatedProblemBase, candidate: RelatedProblemCandidate) {
  const averageDifference =
    (Math.abs(base.demandScore - candidate.demandScore) +
      Math.abs(base.difficultyScore - candidate.difficultyScore) +
      Math.abs(base.monetizationScore - candidate.monetizationScore)) /
    3;

  if (averageDifference <= 8) {
    return {
      score: 3,
      reason: "Similar score profile"
    };
  }

  if (averageDifference <= 18) {
    return {
      score: 1,
      reason: "Roughly similar score profile"
    };
  }

  return {
    score: 0,
    reason: null
  };
}

export function matchRelatedProblems(
  problem: RelatedProblemBase,
  candidates: RelatedProblemCandidate[],
  limit = 3
): RelatedProblemMatch[] {
  return candidates
    .map((candidate) => {
      let matchScore = 0;
      const matchReasons: string[] = [];

      if (problem.category === candidate.category) {
        matchScore += 3;
        matchReasons.push("Same category");
      }

      const sharedTags = getSharedItems(
        problem.tags.map((tag) => tag.id),
        candidate.tags.map((tag) => tag.id)
      ).map((tagId) => candidate.tags.find((tag) => tag.id === tagId)?.name ?? tagId);

      if (sharedTags.length > 0) {
        matchScore += Math.min(sharedTags.length, 2) * 2;
        matchReasons.push(
          `Shared tag${sharedTags.length > 1 ? "s" : ""}: ${sharedTags.slice(0, 2).join(", ")}`
        );
      }

      const sharedProjectTypes = getSharedItems(problem.projectTypes, candidate.projectTypes);

      if (sharedProjectTypes.length > 0) {
        matchScore += Math.min(sharedProjectTypes.length, 2) * 2;
        matchReasons.push(
          `Shared project type${sharedProjectTypes.length > 1 ? "s" : ""}: ${sharedProjectTypes
            .slice(0, 2)
            .map((projectType) => formatEnumLabel(projectType))
            .join(", ")}`
        );
      }

      const similarity = getScoreSimilarityBonus(problem, candidate);

      if (similarity.reason) {
        matchScore += similarity.score;
        matchReasons.push(similarity.reason);
      }

      return {
        ...candidate,
        matchScore,
        matchReasons
      };
    })
    .filter((candidate) => candidate.matchScore > 0)
    .sort((left, right) => {
      if (right.matchScore !== left.matchScore) {
        return right.matchScore - left.matchScore;
      }

      if (right.demandScore !== left.demandScore) {
        return right.demandScore - left.demandScore;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}
