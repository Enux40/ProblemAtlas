import type { Route } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteProblem, updateProblem } from "@/app/admin/problems/actions";
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

type EditProblemPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProblemPage({ params }: EditProblemPageProps) {
  const { id } = await params;

  const [problem, tagOptions, stackOptions] = await Promise.all([
    prisma.problem.findUnique({
      where: { id },
      include: {
        evidences: {
          orderBy: [{ signalStrength: "desc" }, { createdAt: "asc" }]
        },
        tags: {
          select: { id: true }
        },
        stacks: {
          select: { id: true }
        }
      }
    }),
    prisma.problemTag.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    }),
    prisma.problemStack.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    })
  ]);

  if (!problem) {
    notFound();
  }

  const initialValues: ProblemFormValues = {
    title: problem.title,
    slug: problem.slug,
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
    industry: problem.industry ?? "",
    geographyFocus: problem.geographyFocus ?? "",
    companySize: problem.companySize ?? "",
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
    tagIds: problem.tags.map((tag) => tag.id),
    stackIds: problem.stacks.map((stack) => stack.id),
    evidences: problem.evidences.map((evidence) => ({
      title: evidence.title,
      summary: evidence.summary,
      sourceType: evidence.sourceType,
      sourceName: evidence.sourceName,
      sourceUrl: evidence.sourceUrl ?? "",
      snippet: evidence.snippet ?? "",
      signalStrength: String(evidence.signalStrength),
      capturedAt: evidence.capturedAt
        ? evidence.capturedAt.toISOString().slice(0, 10)
        : ""
    }))
  };

  const updateProblemAction = updateProblem.bind(null, problem.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-serif text-5xl">Edit problem</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Update the brief, adjust publication status, and keep the public detail page accurate.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={"/admin/problems" as Route}>Back to manager</Link>
          </Button>
          <form action={deleteProblem.bind(null, problem.id)}>
            <Button type="submit" variant="ghost" className="text-red-700 hover:text-red-800">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <Card className="bg-card/85">
        <CardHeader>
          <CardTitle>{problem.title}</CardTitle>
          <CardDescription>
            Save changes here to update both the admin listing and the public directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProblemForm
            action={updateProblemAction}
            submitLabel="Save changes"
            initialValues={initialValues}
            tagOptions={tagOptions}
            stackOptions={stackOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
