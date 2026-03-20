"use server";

import type { Route } from "next";
import { ProblemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { isDatabaseConfigured } from "@/lib/database";
import { prisma } from "@/lib/prisma";
import { problemFormSchema } from "@/lib/problem-form-schema";

export type ProblemFormState = {
  message?: string;
  fields?: Record<string, string>;
  errors?: Record<string, string[]>;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getStringArray(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

function buildEvidencePayload(formData: FormData) {
  const titles = getStringArray(formData, "evidenceTitle");
  const summaries = getStringArray(formData, "evidenceSummary");
  const sourceTypes = getStringArray(formData, "evidenceSourceType");
  const sourceNames = getStringArray(formData, "evidenceSourceName");
  const sourceUrls = getStringArray(formData, "evidenceSourceUrl");
  const snippets = getStringArray(formData, "evidenceSnippet");
  const signalStrengths = getStringArray(formData, "evidenceSignalStrength");
  const capturedDates = getStringArray(formData, "evidenceCapturedAt");

  const total = Math.max(
    titles.length,
    summaries.length,
    sourceTypes.length,
    sourceNames.length,
    sourceUrls.length,
    snippets.length,
    signalStrengths.length,
    capturedDates.length
  );

  return Array.from({ length: total }, (_, index) => ({
    title: titles[index] ?? "",
    summary: summaries[index] ?? "",
    sourceType: sourceTypes[index] ?? "",
    sourceName: sourceNames[index] ?? "",
    sourceUrl: sourceUrls[index] ?? "",
    snippet: snippets[index] ?? "",
    signalStrength: signalStrengths[index] ?? "",
    capturedAt: capturedDates[index] ?? ""
  })).filter((entry) =>
    Object.values(entry).some((value) => String(value).trim().length > 0)
  );
}

function buildProblemPayload(formData: FormData) {
  return {
    title: getString(formData, "title"),
    slug: getString(formData, "slug"),
    tagline: getString(formData, "tagline"),
    excerpt: getString(formData, "excerpt"),
    summary: getString(formData, "summary"),
    description: getString(formData, "description"),
    targetUser: getString(formData, "targetUser"),
    painPoint: getString(formData, "painPoint"),
    suggestedMvp: getString(formData, "suggestedMvp"),
    demandSignalsSummary: getString(formData, "demandSignalsSummary"),
    riskNotes: getString(formData, "riskNotes"),
    category: getString(formData, "category"),
    industry: getString(formData, "industry"),
    geographyFocus: getString(formData, "geographyFocus"),
    companySize: getString(formData, "companySize"),
    recommendedSkill: getString(formData, "recommendedSkill"),
    projectTypes: getStringArray(formData, "projectTypes"),
    monetizationTypes: getStringArray(formData, "monetizationTypes"),
    status: getString(formData, "status"),
    buildTimeValue: getString(formData, "buildTimeValue"),
    buildTimeUnit: getString(formData, "buildTimeUnit"),
    difficultyScore: getString(formData, "difficultyScore"),
    demandScore: getString(formData, "demandScore"),
    monetizationScore: getString(formData, "monetizationScore"),
    validationScore: getString(formData, "validationScore"),
    editorialScore: getString(formData, "editorialScore"),
    featured: formData.get("featured") === "on",
    tagIds: getStringArray(formData, "tagIds"),
    stackIds: getStringArray(formData, "stackIds"),
    evidences: buildEvidencePayload(formData)
  };
}

function flattenZodErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of issues) {
    const key = issue.path
      .map((segment) => (typeof segment === "number" ? String(segment) : segment))
      .join(".");

    if (!errors[key]) {
      errors[key] = [];
    }

    errors[key].push(issue.message);
  }

  return errors;
}

async function parseProblemForm(formData: FormData): Promise<
  | { success: true; data: ReturnType<typeof problemFormSchema.parse> }
  | { success: false; state: ProblemFormState }
> {
  const parsed = problemFormSchema.safeParse(buildProblemPayload(formData));

  if (!parsed.success) {
    return {
      success: false,
      state: {
        message: "Please correct the highlighted fields and try again.",
        fields: (() => {
          const payload = buildProblemPayload(formData);

          return {
            ...Object.fromEntries(
              Object.entries(payload).map(([key, value]) => [
                key,
                Array.isArray(value) ? value.join(",") : String(value ?? "")
              ])
            ),
            evidencesJson: JSON.stringify(payload.evidences)
          };
        })(),
        errors: flattenZodErrors(parsed.error.issues)
      }
    };
  }

  return { success: true, data: parsed.data };
}

function toProblemWriteData(data: ReturnType<typeof problemFormSchema.parse>) {
  const publishedAt = data.status === ProblemStatus.PUBLISHED ? new Date() : null;

  return {
    title: data.title,
    slug: data.slug,
    tagline: data.tagline,
    excerpt: data.excerpt,
    summary: data.summary,
    description: data.description,
    targetUser: data.targetUser,
    painPoint: data.painPoint,
    suggestedMvp: data.suggestedMvp,
    demandSignalsSummary: data.demandSignalsSummary,
    riskNotes: data.riskNotes,
    category: data.category,
    industry: data.industry,
    geographyFocus: data.geographyFocus,
    companySize: data.companySize,
    recommendedSkill: data.recommendedSkill,
    projectTypes: data.projectTypes,
    monetizationTypes: data.monetizationTypes,
    status: data.status,
    buildTimeValue: data.buildTimeValue,
    buildTimeUnit: data.buildTimeUnit,
    difficultyScore: data.difficultyScore,
    demandScore: data.demandScore,
    monetizationScore: data.monetizationScore,
    validationScore: data.validationScore,
    editorialScore: data.editorialScore,
    featured: data.featured,
    publishedAt
  };
}

export async function createProblem(
  _prevState: ProblemFormState,
  formData: FormData
): Promise<ProblemFormState> {
  await requireAdmin();

  if (!isDatabaseConfigured()) {
    return {
      message: "Database setup is required before problems can be created."
    };
  }

  const parsed = await parseProblemForm(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  try {
    await prisma.problem.create({
      data: {
        ...toProblemWriteData(parsed.data),
        tags: {
          connect: parsed.data.tagIds.map((id) => ({ id }))
        },
        stacks: {
          connect: parsed.data.stackIds.map((id) => ({ id }))
        },
        evidences: {
          create: parsed.data.evidences.map((evidence) => ({
            title: evidence.title,
            summary: evidence.summary,
            sourceType: evidence.sourceType,
            sourceName: evidence.sourceName,
            sourceUrl: evidence.sourceUrl || null,
            snippet: evidence.snippet,
            signalStrength: evidence.signalStrength,
            capturedAt: evidence.capturedAt ? new Date(evidence.capturedAt) : null
          }))
        }
      }
    });
  } catch (error) {
    return {
      message:
        error instanceof Error && error.message.includes("Unique constraint")
          ? "That slug is already in use. Choose a different slug."
          : "We couldn't create the problem right now. Please try again."
    };
  }

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  redirect("/admin/problems" as Route);
}

export async function updateProblem(
  id: string,
  _prevState: ProblemFormState,
  formData: FormData
): Promise<ProblemFormState> {
  await requireAdmin();

  if (!isDatabaseConfigured()) {
    return {
      message: "Database setup is required before problems can be updated."
    };
  }

  const existing = await prisma.problem.findUnique({
    where: { id },
    select: { slug: true, publishedAt: true }
  });

  if (!existing) {
    return {
      message: "That problem no longer exists."
    };
  }

  const parsed = await parseProblemForm(formData);

  if (!parsed.success) {
    return parsed.state;
  }

  try {
    const writeData = toProblemWriteData(parsed.data);

    await prisma.problem.update({
      where: { id },
      data: {
        ...writeData,
        publishedAt:
          parsed.data.status === ProblemStatus.PUBLISHED
            ? existing.publishedAt ?? writeData.publishedAt
            : null,
        tags: {
          set: parsed.data.tagIds.map((tagId) => ({ id: tagId }))
        },
        stacks: {
          set: parsed.data.stackIds.map((stackId) => ({ id: stackId }))
        },
        evidences: {
          deleteMany: {},
          create: parsed.data.evidences.map((evidence) => ({
            title: evidence.title,
            summary: evidence.summary,
            sourceType: evidence.sourceType,
            sourceName: evidence.sourceName,
            sourceUrl: evidence.sourceUrl || null,
            snippet: evidence.snippet,
            signalStrength: evidence.signalStrength,
            capturedAt: evidence.capturedAt ? new Date(evidence.capturedAt) : null
          }))
        }
      }
    });
  } catch (error) {
    return {
      message:
        error instanceof Error && error.message.includes("Unique constraint")
          ? "That slug is already in use. Choose a different slug."
          : "We couldn't save your changes right now. Please try again."
    };
  }

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  revalidatePath(`/problems/${existing.slug}`);
  revalidatePath(`/problems/${parsed.data.slug}`);
  redirect("/admin/problems" as Route);
}

export async function updateProblemStatus(id: string, status: ProblemStatus) {
  await requireAdmin();

  if (!isDatabaseConfigured()) {
    redirect("/admin/problems" as Route);
  }

  const existing = await prisma.problem.findUnique({
    where: { id },
    select: { slug: true, publishedAt: true }
  });

  if (!existing) {
    redirect("/admin/problems" as Route);
  }

  await prisma.problem.update({
    where: { id },
    data: {
      status,
      publishedAt:
        status === ProblemStatus.PUBLISHED ? existing.publishedAt ?? new Date() : null
    }
  });

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  revalidatePath(`/problems/${existing.slug}`);
  redirect("/admin/problems" as Route);
}

export async function deleteProblem(id: string) {
  await requireAdmin();

  if (!isDatabaseConfigured()) {
    redirect("/admin/problems" as Route);
  }

  const existing = await prisma.problem.findUnique({
    where: { id },
    select: { slug: true }
  });

  if (!existing) {
    redirect("/admin/problems" as Route);
  }

  await prisma.problem.delete({
    where: { id }
  });

  revalidatePath("/admin/problems");
  revalidatePath("/problems");
  revalidatePath(`/problems/${existing.slug}`);
  redirect("/admin/problems" as Route);
}
