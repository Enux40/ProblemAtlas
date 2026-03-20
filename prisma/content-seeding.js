/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs/promises");
const path = require("node:path");
const { z } = require("zod");

const skillLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const projectTypes = [
  "SAAS",
  "INTERNAL_TOOL",
  "MARKETPLACE",
  "AUTOMATION",
  "ANALYTICS",
  "DEVELOPER_TOOL",
  "MOBILE_APP",
  "SERVICE_BUSINESS_TOOL",
];
const monetizationTypes = [
  "SUBSCRIPTION",
  "ONE_TIME_LICENSE",
  "USAGE_BASED",
  "LEAD_GEN",
  "AGENCY_UPSELL",
  "TRANSACTION_FEE",
];
const sourceTypes = [
  "INTERVIEW",
  "FORUM",
  "JOB_POSTING",
  "REVIEW_SITE",
  "SEARCH_TREND",
  "MARKET_REPORT",
  "SUPPORT_TICKET",
  "SOCIAL_POST",
];
const problemStatuses = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];
const buildTimeUnits = ["DAYS", "WEEKS", "MONTHS"];

function optionalString() {
  return z.string().trim().min(1).optional().nullable();
}

function dateField() {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "string" || typeof value === "number") {
      return new Date(value);
    }

    return value;
  }, z.date().nullable().refine((value) => value === null || !Number.isNaN(value.getTime()), "Invalid date value"));
}

const tagSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: optionalString(),
});

const stackSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: optionalString(),
});

const evidenceSchema = z.object({
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  sourceType: z.enum(sourceTypes),
  sourceName: z.string().trim().min(1),
  sourceUrl: z.union([z.string().url(), z.literal(null)]).optional().default(null),
  snippet: optionalString(),
  signalStrength: z.number().int().min(1).max(5),
  capturedAt: dateField().optional().default(null),
});

const adminNoteSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  isInternal: z.boolean().optional().default(true),
  pinned: z.boolean().optional().default(false),
  createdBy: z.string().trim().min(1),
});

const problemSchema = z.object({
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  tagline: z.string().trim().min(1),
  excerpt: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  description: z.string().trim().min(1),
  targetUser: z.string().trim().min(1),
  painPoint: z.string().trim().min(1),
  suggestedMvp: z.string().trim().min(1),
  demandSignalsSummary: z.string().trim().min(1),
  riskNotes: z.string().trim().min(1),
  category: z.string().trim().min(1),
  industry: optionalString(),
  geographyFocus: optionalString(),
  companySize: optionalString(),
  recommendedSkill: z.enum(skillLevels),
  projectTypes: z.array(z.enum(projectTypes)).min(1),
  monetizationTypes: z.array(z.enum(monetizationTypes)).min(1),
  status: z.enum(problemStatuses),
  buildTimeValue: z.number().int().positive(),
  buildTimeUnit: z.enum(buildTimeUnits),
  difficultyScore: z.number().int().min(1).max(100),
  demandScore: z.number().int().min(1).max(100),
  monetizationScore: z.number().int().min(1).max(100),
  validationScore: z.number().int().min(1).max(100),
  editorialScore: z.number().int().min(1).max(100),
  featured: z.boolean().optional().default(false),
  publishedAt: dateField().optional().default(null),
  tagSlugs: z.array(z.string().trim().min(1)).default([]),
  stackSlugs: z.array(z.string().trim().min(1)).default([]),
  evidences: z.array(evidenceSchema).default([]),
  adminNotes: z.array(adminNoteSchema).default([]),
});

const newsletterSignupSchema = z.object({
  email: z.string().trim().email(),
  firstName: optionalString(),
  source: optionalString(),
  interests: z.array(z.string().trim().min(1)).default([]),
  confirmedAt: dateField().optional().default(null),
  unsubscribedAt: dateField().optional().default(null),
});

const contentSchema = z.object({
  tags: z.array(tagSchema).default([]),
  stacks: z.array(stackSchema).default([]),
  problems: z.array(problemSchema).default([]),
  newsletterSignups: z.array(newsletterSignupSchema).default([]),
});

function normalizeContentInput(input) {
  if (Array.isArray(input)) {
    return { problems: input };
  }

  return input;
}

function uniqueBy(items, key) {
  const seen = new Set();

  return items.filter((item) => {
    const value = item[key];

    if (seen.has(value)) {
      return false;
    }

    seen.add(value);
    return true;
  });
}

async function loadContentFile(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  return validateContent(normalizeContentInput(parsed));
}

function validateContent(input) {
  return contentSchema.parse(normalizeContentInput(input));
}

async function ensureReferenceCatalog(prisma, content) {
  const incomingTags = uniqueBy(content.tags, "slug");
  const incomingStacks = uniqueBy(content.stacks, "slug");

  for (const tag of incomingTags) {
    await prisma.problemTag.upsert({
      where: { slug: tag.slug },
      update: {
        name: tag.name,
        description: tag.description ?? null,
      },
      create: {
        slug: tag.slug,
        name: tag.name,
        description: tag.description ?? null,
      },
    });
  }

  for (const stack of incomingStacks) {
    await prisma.problemStack.upsert({
      where: { slug: stack.slug },
      update: {
        name: stack.name,
        category: stack.category,
        description: stack.description ?? null,
      },
      create: {
        slug: stack.slug,
        name: stack.name,
        category: stack.category,
        description: stack.description ?? null,
      },
    });
  }
}

async function assertProblemReferences(prisma, problems) {
  const tagSlugs = [...new Set(problems.flatMap((problem) => problem.tagSlugs))];
  const stackSlugs = [...new Set(problems.flatMap((problem) => problem.stackSlugs))];

  const [existingTags, existingStacks] = await Promise.all([
    prisma.problemTag.findMany({
      where: { slug: { in: tagSlugs } },
      select: { slug: true },
    }),
    prisma.problemStack.findMany({
      where: { slug: { in: stackSlugs } },
      select: { slug: true },
    }),
  ]);

  const knownTags = new Set(existingTags.map((tag) => tag.slug));
  const knownStacks = new Set(existingStacks.map((stack) => stack.slug));
  const missingTags = tagSlugs.filter((slug) => !knownTags.has(slug));
  const missingStacks = stackSlugs.filter((slug) => !knownStacks.has(slug));

  if (missingTags.length > 0 || missingStacks.length > 0) {
    const parts = [];

    if (missingTags.length > 0) {
      parts.push(`Missing tags: ${missingTags.join(", ")}`);
    }

    if (missingStacks.length > 0) {
      parts.push(`Missing stacks: ${missingStacks.join(", ")}`);
    }

    throw new Error(`${parts.join(". ")}. Add them to the JSON file or seed them first.`);
  }
}

function getProblemScalarData(problem) {
  return {
    slug: problem.slug,
    title: problem.title,
    tagline: problem.tagline,
    excerpt: problem.excerpt,
    summary: problem.summary,
    description: problem.description,
    targetUser: problem.targetUser,
    painPoint: problem.painPoint,
    suggestedMvp: problem.suggestedMvp,
    demandSignalsSummary: problem.demandSignalsSummary,
    riskNotes: problem.riskNotes,
    category: problem.category,
    industry: problem.industry ?? null,
    geographyFocus: problem.geographyFocus ?? null,
    companySize: problem.companySize ?? null,
    recommendedSkill: problem.recommendedSkill,
    projectTypes: problem.projectTypes,
    monetizationTypes: problem.monetizationTypes,
    status: problem.status,
    buildTimeValue: problem.buildTimeValue,
    buildTimeUnit: problem.buildTimeUnit,
    difficultyScore: problem.difficultyScore,
    demandScore: problem.demandScore,
    monetizationScore: problem.monetizationScore,
    validationScore: problem.validationScore,
    editorialScore: problem.editorialScore,
    featured: problem.featured,
    publishedAt: problem.publishedAt,
  };
}

async function upsertProblem(prisma, problem) {
  const scalarData = getProblemScalarData(problem);

  await prisma.problem.upsert({
    where: { slug: problem.slug },
    create: scalarData,
    update: scalarData,
  });

  await prisma.problem.update({
    where: { slug: problem.slug },
    data: {
      tags: {
        set: problem.tagSlugs.map((slug) => ({ slug })),
      },
      stacks: {
        set: problem.stackSlugs.map((slug) => ({ slug })),
      },
      evidences: {
        deleteMany: {},
        create: problem.evidences.map((evidence) => ({
          ...evidence,
          sourceUrl: evidence.sourceUrl ?? null,
          snippet: evidence.snippet ?? null,
          capturedAt: evidence.capturedAt ?? null,
        })),
      },
      adminNotes: {
        deleteMany: {},
        create: problem.adminNotes.map((adminNote) => ({
          ...adminNote,
          isInternal: adminNote.isInternal ?? true,
          pinned: adminNote.pinned ?? false,
        })),
      },
    },
  });
}

async function upsertNewsletterSignups(prisma, newsletterSignups) {
  for (const signup of newsletterSignups) {
    await prisma.newsletterSignup.upsert({
      where: { email: signup.email },
      create: {
        ...signup,
        firstName: signup.firstName ?? null,
        source: signup.source ?? null,
        confirmedAt: signup.confirmedAt ?? null,
        unsubscribedAt: signup.unsubscribedAt ?? null,
      },
      update: {
        firstName: signup.firstName ?? null,
        source: signup.source ?? null,
        interests: signup.interests,
        confirmedAt: signup.confirmedAt ?? null,
        unsubscribedAt: signup.unsubscribedAt ?? null,
      },
    });
  }
}

async function resetContent(prisma) {
  await prisma.adminNote.deleteMany();
  await prisma.problemEvidence.deleteMany();
  await prisma.newsletterSignup.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.problemTag.deleteMany();
  await prisma.problemStack.deleteMany();
}

async function importCuratedContent(prisma, input, options = {}) {
  const content = validateContent(input);

  if (options.reset) {
    await resetContent(prisma);
  }

  await ensureReferenceCatalog(prisma, content);
  await assertProblemReferences(prisma, content.problems);

  for (const problem of content.problems) {
    await upsertProblem(prisma, problem);
  }

  await upsertNewsletterSignups(prisma, content.newsletterSignups);

  return {
    tags: content.tags.length,
    stacks: content.stacks.length,
    problems: content.problems.length,
    newsletterSignups: content.newsletterSignups.length,
  };
}

module.exports = {
  importCuratedContent,
  loadContentFile,
  validateContent,
};
