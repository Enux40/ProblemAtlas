/* eslint-disable @typescript-eslint/no-require-imports */
import type {
  BuildTimeUnit,
  MonetizationType,
  ProblemStatus,
  ProjectType,
  SkillLevel,
  SourceType
} from "@prisma/client";

const fs = require("node:fs/promises") as typeof import("node:fs/promises");
const path = require("node:path") as typeof import("node:path");
const {
  PrismaClient,
  BuildTimeUnit: PrismaBuildTimeUnit,
  ProblemStatus: PrismaProblemStatus,
  SkillLevel: PrismaSkillLevel,
  SourceType: PrismaSourceType,
  ProjectType: PrismaProjectType,
  MonetizationType: PrismaMonetizationType
} = require("@prisma/client") as typeof import("@prisma/client");
const { z } = require("zod") as typeof import("zod");

const prisma = new PrismaClient();
const dataFilePath = path.join(process.cwd(), "prisma", "data", "problems.json");

const rawEvidenceSchema = z.object({
  sourceType: z.string().min(1),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().nullable().optional(),
  evidenceSummary: z.string().min(1),
  observedDate: z.string().datetime().nullable().optional(),
  confidenceScore: z.number().int().min(1).max(5)
});

const rawTagSchema = z.object({
  tag: z.string().min(1)
});

const rawStackSchema = z.object({
  stackName: z.string().min(1)
});

const rawAdminNoteSchema = z.object({
  note: z.string().min(1)
});

const rawProblemSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  shortSummary: z.string().min(1),
  fullDescription: z.string().min(1),
  targetUser: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  skillLevel: z.string().min(1),
  projectType: z.string().min(1),
  monetizationType: z.string().min(1),
  estimatedBuildTime: z.number().int().positive(),
  buildTimeUnit: z.string().min(1),
  difficultyScore: z.number().int().min(1).max(5),
  demandScore: z.number().int().min(1).max(5),
  urgencyScore: z.number().int().min(1).max(5),
  monetizationScore: z.number().int().min(1).max(5),
  saturationScore: z.number().int().min(1).max(5),
  portfolioScore: z.number().int().min(1).max(5),
  practiceScore: z.number().int().min(1).max(5),
  sourceConfidence: z.number().int().min(1).max(5),
  overallLabel: z.string().min(1),
  status: z.string().min(1),
  featured: z.boolean(),
  evidence: z.array(rawEvidenceSchema).default([]),
  tags: z.array(rawTagSchema).default([]),
  stacks: z.array(rawStackSchema).default([]),
  adminNotes: z.array(rawAdminNoteSchema).default([])
});

const datasetSchema = z.array(rawProblemSchema);

type RawEvidence = {
  sourceType: string;
  sourceName: string;
  sourceUrl?: string | null;
  evidenceSummary: string;
  observedDate?: string | null;
  confidenceScore: number;
};

type RawTag = {
  tag: string;
};

type RawStack = {
  stackName: string;
};

type RawAdminNote = {
  note: string;
};

type RawProblem = {
  title: string;
  slug: string;
  shortSummary: string;
  fullDescription: string;
  targetUser: string;
  category: string;
  subcategory: string;
  skillLevel: string;
  projectType: string;
  monetizationType: string;
  estimatedBuildTime: number;
  buildTimeUnit: string;
  difficultyScore: number;
  demandScore: number;
  urgencyScore: number;
  monetizationScore: number;
  saturationScore: number;
  portfolioScore: number;
  practiceScore: number;
  sourceConfidence: number;
  overallLabel: string;
  status: string;
  featured: boolean;
  evidence: RawEvidence[];
  tags: RawTag[];
  stacks: RawStack[];
  adminNotes: RawAdminNote[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function scaleScore(value: number) {
  return Math.min(100, Math.max(20, value * 20));
}

function average(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function mapSkillLevel(value: string): SkillLevel {
  switch (value) {
    case PrismaSkillLevel.BEGINNER:
      return PrismaSkillLevel.BEGINNER;
    case PrismaSkillLevel.INTERMEDIATE:
      return PrismaSkillLevel.INTERMEDIATE;
    case PrismaSkillLevel.ADVANCED:
      return PrismaSkillLevel.ADVANCED;
    default:
      throw new Error(`Unsupported skill level "${value}".`);
  }
}

function mapProjectTypes(value: string): ProjectType[] {
  switch (value) {
    case "MICRO_SAAS":
      return [PrismaProjectType.SAAS];
    case "INTERNAL_TOOL":
      return [PrismaProjectType.INTERNAL_TOOL];
    case "PRACTICE":
      return [PrismaProjectType.INTERNAL_TOOL];
    default:
      throw new Error(`Unsupported project type "${value}".`);
  }
}

function mapMonetizationTypes(value: string): MonetizationType[] {
  switch (value) {
    case "SUBSCRIPTION":
      return [PrismaMonetizationType.SUBSCRIPTION];
    case "ONE_TIME":
      return [PrismaMonetizationType.ONE_TIME_LICENSE];
    case "SERVICE":
      return [PrismaMonetizationType.AGENCY_UPSELL];
    default:
      throw new Error(`Unsupported monetization type "${value}".`);
  }
}

function mapProblemStatus(value: string): ProblemStatus {
  switch (value) {
    case PrismaProblemStatus.DRAFT:
      return PrismaProblemStatus.DRAFT;
    case PrismaProblemStatus.REVIEW:
      return PrismaProblemStatus.REVIEW;
    case PrismaProblemStatus.PUBLISHED:
      return PrismaProblemStatus.PUBLISHED;
    case PrismaProblemStatus.ARCHIVED:
      return PrismaProblemStatus.ARCHIVED;
    default:
      throw new Error(`Unsupported problem status "${value}".`);
  }
}

function mapBuildTimeUnit(value: string): BuildTimeUnit {
  switch (value) {
    case PrismaBuildTimeUnit.DAYS:
      return PrismaBuildTimeUnit.DAYS;
    case PrismaBuildTimeUnit.WEEKS:
      return PrismaBuildTimeUnit.WEEKS;
    case PrismaBuildTimeUnit.MONTHS:
      return PrismaBuildTimeUnit.MONTHS;
    default:
      throw new Error(`Unsupported build time unit "${value}".`);
  }
}

function mapSourceType(value: string): SourceType {
  if (Object.values(PrismaSourceType).includes(value as SourceType)) {
    return value as SourceType;
  }

  switch (value) {
    case "MANUAL_RESEARCH":
      return PrismaSourceType.FORUM;
    default:
      return PrismaSourceType.FORUM;
  }
}

function buildPainPoint(problem: RawProblem) {
  return `${problem.shortSummary} This shows up most clearly in ${problem.subcategory.toLowerCase()} workflows for ${problem.targetUser.toLowerCase()}.`;
}

function buildSuggestedMvp(problem: RawProblem) {
  return `Start with a focused ${problem.subcategory.toLowerCase()} workflow for ${problem.targetUser.toLowerCase()}, prioritizing the highest-friction step described in the brief before adding broader automation or reporting.`;
}

function buildDemandSignalsSummary(problem: RawProblem) {
  if (problem.evidence.length > 0) {
    return problem.evidence.map((entry) => entry.evidenceSummary).join(" ");
  }

  return problem.shortSummary;
}

function buildRiskNotes(problem: RawProblem) {
  const notes = [
    problem.overallLabel,
    `Saturation score ${problem.saturationScore}/5 suggests ${problem.saturationScore >= 4 ? "a crowded market that needs sharper positioning" : "some room for clearer differentiation"}.`,
    `Urgency score ${problem.urgencyScore}/5 means the wedge should stay close to an operational pain users already feel.`
  ];

  return notes.join(" ");
}

function buildEditorialScore(problem: RawProblem) {
  return average([
    scaleScore(problem.portfolioScore),
    scaleScore(problem.practiceScore),
    scaleScore(problem.sourceConfidence),
    scaleScore(problem.demandScore),
    scaleScore(6 - problem.saturationScore)
  ]);
}

function buildPublishedAt(problem: RawProblem) {
  if (problem.status !== PrismaProblemStatus.PUBLISHED) {
    return null;
  }

  const firstObservedDate = problem.evidence.find((entry) => entry.observedDate)?.observedDate;
  return firstObservedDate ? new Date(firstObservedDate) : new Date();
}

function buildTagCatalog(problems: RawProblem[]) {
  return Array.from(
    new Map(
      problems
        .flatMap((problem) => problem.tags)
        .map((entry) => {
          const slug = slugify(entry.tag);
          return [
            slug,
            {
              slug,
              name: entry.tag.trim(),
              description: `Imported from prisma/data/problems.json for the ${entry.tag.trim()} topic.`
            }
          ] as const;
        })
    ).values()
  );
}

function buildStackCatalog(problems: RawProblem[]) {
  return Array.from(
    new Map(
      problems
        .flatMap((problem) => problem.stacks)
        .map((entry) => {
          const slug = slugify(entry.stackName);
          return [
            slug,
            {
              slug,
              name: entry.stackName.trim(),
              category: "Imported Stack",
              description: `Imported from prisma/data/problems.json for seeded recommendations.`
            }
          ] as const;
        })
    ).values()
  );
}

async function loadProblems() {
  const rawFile = await fs.readFile(dataFilePath, "utf8");
  return datasetSchema.parse(JSON.parse(rawFile)) as RawProblem[];
}

async function upsertCatalogs(problems: RawProblem[]) {
  const tags = buildTagCatalog(problems);
  const stacks = buildStackCatalog(problems);

  for (const tag of tags) {
    await prisma.problemTag.upsert({
      where: { slug: tag.slug },
      update: {
        name: tag.name,
        description: tag.description
      },
      create: tag
    });
  }

  for (const stack of stacks) {
    await prisma.problemStack.upsert({
      where: { slug: stack.slug },
      update: {
        name: stack.name,
        category: stack.category,
        description: stack.description
      },
      create: stack
    });
  }
}

async function upsertProblem(problem: RawProblem) {
  const tagSlugs = Array.from(new Set(problem.tags.map((entry) => slugify(entry.tag))));
  const stackSlugs = Array.from(
    new Set(problem.stacks.map((entry) => slugify(entry.stackName)))
  );

  await prisma.problem.upsert({
    where: { slug: problem.slug },
    update: {
      title: problem.title,
      tagline: problem.shortSummary,
      excerpt: problem.shortSummary,
      summary: problem.fullDescription,
      description: problem.fullDescription,
      targetUser: problem.targetUser,
      painPoint: buildPainPoint(problem),
      suggestedMvp: buildSuggestedMvp(problem),
      demandSignalsSummary: buildDemandSignalsSummary(problem),
      riskNotes: buildRiskNotes(problem),
      category: problem.category,
      industry: problem.subcategory,
      geographyFocus: null,
      companySize: null,
      recommendedSkill: mapSkillLevel(problem.skillLevel),
      projectTypes: mapProjectTypes(problem.projectType),
      monetizationTypes: mapMonetizationTypes(problem.monetizationType),
      status: mapProblemStatus(problem.status),
      buildTimeValue: problem.estimatedBuildTime,
      buildTimeUnit: mapBuildTimeUnit(problem.buildTimeUnit),
      difficultyScore: scaleScore(problem.difficultyScore),
      demandScore: scaleScore(problem.demandScore),
      monetizationScore: scaleScore(problem.monetizationScore),
      validationScore: scaleScore(problem.sourceConfidence),
      editorialScore: buildEditorialScore(problem),
      featured: problem.featured,
      publishedAt: buildPublishedAt(problem)
    },
    create: {
      slug: problem.slug,
      title: problem.title,
      tagline: problem.shortSummary,
      excerpt: problem.shortSummary,
      summary: problem.fullDescription,
      description: problem.fullDescription,
      targetUser: problem.targetUser,
      painPoint: buildPainPoint(problem),
      suggestedMvp: buildSuggestedMvp(problem),
      demandSignalsSummary: buildDemandSignalsSummary(problem),
      riskNotes: buildRiskNotes(problem),
      category: problem.category,
      industry: problem.subcategory,
      geographyFocus: null,
      companySize: null,
      recommendedSkill: mapSkillLevel(problem.skillLevel),
      projectTypes: mapProjectTypes(problem.projectType),
      monetizationTypes: mapMonetizationTypes(problem.monetizationType),
      status: mapProblemStatus(problem.status),
      buildTimeValue: problem.estimatedBuildTime,
      buildTimeUnit: mapBuildTimeUnit(problem.buildTimeUnit),
      difficultyScore: scaleScore(problem.difficultyScore),
      demandScore: scaleScore(problem.demandScore),
      monetizationScore: scaleScore(problem.monetizationScore),
      validationScore: scaleScore(problem.sourceConfidence),
      editorialScore: buildEditorialScore(problem),
      featured: problem.featured,
      publishedAt: buildPublishedAt(problem)
    }
  });

  await prisma.problem.update({
    where: { slug: problem.slug },
    data: {
      tags: {
        set: tagSlugs.map((slug) => ({ slug }))
      },
      stacks: {
        set: stackSlugs.map((slug) => ({ slug }))
      },
      evidences: {
        deleteMany: {},
        create: problem.evidence.map((entry, index) => ({
          title: `${entry.sourceName} evidence ${index + 1}`,
          summary: entry.evidenceSummary,
          sourceType: mapSourceType(entry.sourceType),
          sourceName: entry.sourceName,
          sourceUrl: entry.sourceUrl ?? null,
          snippet: entry.evidenceSummary,
          signalStrength: entry.confidenceScore,
          capturedAt: entry.observedDate ? new Date(entry.observedDate) : null
        }))
      },
      adminNotes: {
        deleteMany: {},
        create: problem.adminNotes.map((entry, index) => ({
          title: `Seed note ${index + 1}`,
          body: entry.note,
          isInternal: true,
          pinned: index === 0,
          createdBy: "seed@problematlas.local"
        }))
      }
    }
  });
}

async function main() {
  const problems = await loadProblems();

  await upsertCatalogs(problems);

  for (const problem of problems) {
    await upsertProblem(problem);
  }

  console.log(`Seeded ${problems.length} problems from prisma/data/problems.json.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
