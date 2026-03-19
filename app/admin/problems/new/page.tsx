import {
  BuildTimeUnit,
  ProblemStatus,
  ProjectType,
  SkillLevel
} from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { createProblem } from "@/app/admin/problems/actions";
import { ProblemForm, type ProblemFormValues } from "@/components/admin/problem-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const initialValues: ProblemFormValues = {
  title: "",
  slug: "",
  tagline: "",
  excerpt: "",
  summary: "",
  description: "",
  targetUser: "",
  painPoint: "",
  suggestedMvp: "",
  demandSignalsSummary: "",
  riskNotes: "",
  category: "",
  industry: "",
  geographyFocus: "",
  companySize: "",
  recommendedSkill: SkillLevel.INTERMEDIATE,
  projectTypes: [ProjectType.SAAS],
  monetizationTypes: [],
  status: ProblemStatus.DRAFT,
  buildTimeValue: 6,
  buildTimeUnit: BuildTimeUnit.WEEKS,
  difficultyScore: 50,
  demandScore: 50,
  monetizationScore: 50,
  validationScore: 50,
  editorialScore: 50,
  featured: false,
  tagIds: [],
  stackIds: [],
  evidences: []
};

export default async function NewProblemPage() {
  const [tagOptions, stackOptions] = await Promise.all([
    prisma.problemTag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    }),
    prisma.problemStack.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    })
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-serif text-5xl">New problem</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Add a new brief with enough editorial structure for search, scoring, and publication.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={"/admin/problems" as Route}>Back to manager</Link>
        </Button>
      </div>

      <Card className="bg-card/85">
        <CardHeader>
          <CardTitle>Create problem</CardTitle>
          <CardDescription>
            Required fields are validated with Zod before anything is saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProblemForm
            action={createProblem}
            submitLabel="Create problem"
            initialValues={initialValues}
            tagOptions={tagOptions}
            stackOptions={stackOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
