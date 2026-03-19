import {
  BuildTimeUnit,
  MonetizationType,
  ProblemStatus,
  ProjectType,
  SkillLevel,
  SourceType
} from "@prisma/client";
import { z } from "zod";

const scoreField = z.coerce.number().int().min(0).max(100);

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid admin email address."),
  password: z.string().min(1, "Enter your admin password.")
});

export const problemEvidenceSchema = z.object({
  title: z.string().trim().min(3, "Evidence title must be at least 3 characters."),
  summary: z.string().trim().min(10, "Evidence summary must be at least 10 characters."),
  sourceType: z.nativeEnum(SourceType, {
    error: "Choose a source type."
  }),
  sourceName: z.string().trim().min(2, "Source name is required."),
  sourceUrl: z.union([z.literal(""), z.string().trim().url("Enter a valid source URL.")]).optional(),
  snippet: optionalText,
  signalStrength: z.coerce.number().int().min(1, "Signal must be between 1 and 5.").max(5, "Signal must be between 1 and 5."),
  capturedAt: z
    .union([z.literal(""), z.string().date("Enter a valid capture date.")])
    .optional()
});

export const problemFormSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  tagline: z.string().trim().min(10, "Tagline must be at least 10 characters."),
  excerpt: z.string().trim().min(20, "Excerpt must be at least 20 characters."),
  summary: z.string().trim().min(20, "Summary must be at least 20 characters."),
  description: z.string().trim().min(30, "Description must be at least 30 characters."),
  targetUser: z.string().trim().min(10, "Target user must be at least 10 characters."),
  painPoint: z.string().trim().min(20, "Pain point must be at least 20 characters."),
  suggestedMvp: z.string().trim().min(20, "Suggested MVP must be at least 20 characters."),
  demandSignalsSummary: z
    .string()
    .trim()
    .min(20, "Demand signal summary must be at least 20 characters."),
  riskNotes: z.string().trim().min(20, "Risk notes must be at least 20 characters."),
  category: z.string().trim().min(2, "Category is required."),
  industry: optionalText,
  geographyFocus: optionalText,
  companySize: optionalText,
  recommendedSkill: z.nativeEnum(SkillLevel, {
    error: "Choose a skill level."
  }),
  projectTypes: z
    .array(z.nativeEnum(ProjectType))
    .min(1, "Choose at least one project type."),
  monetizationTypes: z
    .array(z.nativeEnum(MonetizationType))
    .min(1, "Choose at least one monetization model."),
  status: z.nativeEnum(ProblemStatus, {
    error: "Choose a publishing status."
  }),
  buildTimeValue: z.coerce.number().int().positive("Build time must be greater than 0."),
  buildTimeUnit: z.nativeEnum(BuildTimeUnit, {
    error: "Choose a build time unit."
  }),
  difficultyScore: scoreField,
  demandScore: scoreField,
  monetizationScore: scoreField,
  validationScore: scoreField,
  editorialScore: scoreField,
  featured: z.boolean(),
  tagIds: z.array(z.string()).default([]),
  stackIds: z.array(z.string()).default([]),
  evidences: z.array(problemEvidenceSchema).default([])
});

export type ProblemFormValues = z.infer<typeof problemFormSchema>;
