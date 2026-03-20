import { ProblemStatus } from "@prisma/client";
import type { Route } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  deleteProblem,
  updateProblem,
  updateProblemStatus
} from "@/app/admin/problems/actions";
import { ProblemForm, type ProblemFormValues } from "@/components/admin/problem-form";
import { DatabaseNotice } from "@/components/database-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { withDatabaseFallback } from "@/lib/database";
import { formatEnumLabel } from "@/lib/problem-presenters";
import { prisma } from "@/lib/prisma";

type EditProblemPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProblemPage({ params }: EditProblemPageProps) {
  const { id } = await params;

  const { data, unavailable: databaseUnavailable } = await withDatabaseFallback(
    () =>
      Promise.all([
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
      ]),
    [null, [], []]
  );
  const [problem, tagOptions, stackOptions] = data;

  if (!problem) {
    if (databaseUnavailable) {
      return (
        <div className="space-y-8">
          <DatabaseNotice compact />
          <Card>
            <CardHeader>
              <CardTitle>Edit route unavailable</CardTitle>
              <CardDescription>
                Configure `DATABASE_URL` and restart the app before editing problem records.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

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
      {databaseUnavailable ? <DatabaseNotice compact /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-serif text-5xl">Edit problem</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Update the brief, adjust publication status, and keep the public detail page accurate.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge variant={getStatusBadgeVariant(problem.status)}>
              {formatStatus(problem.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {getStatusDescription(problem.status)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={updateProblemStatus.bind(null, problem.id, ProblemStatus.DRAFT)}>
            <Button
              type="submit"
              variant="outline"
              disabled={problem.status === ProblemStatus.DRAFT}
            >
              Move to draft
            </Button>
          </form>
          <form action={updateProblemStatus.bind(null, problem.id, ProblemStatus.PUBLISHED)}>
            <Button type="submit" disabled={problem.status === ProblemStatus.PUBLISHED}>
              Publish
            </Button>
          </form>
          <form action={updateProblemStatus.bind(null, problem.id, ProblemStatus.ARCHIVED)}>
            <Button
              type="submit"
              variant="secondary"
              disabled={problem.status === ProblemStatus.ARCHIVED}
            >
              Archive
            </Button>
          </form>
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
            Save changes here to update the admin record. Only published problems appear on the
            public site.
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

function getStatusBadgeVariant(status: ProblemStatus) {
  switch (status) {
    case ProblemStatus.PUBLISHED:
      return "accent" as const;
    case ProblemStatus.ARCHIVED:
      return "outline" as const;
    default:
      return "default" as const;
  }
}

function getStatusDescription(status: ProblemStatus) {
  switch (status) {
    case ProblemStatus.PUBLISHED:
      return "Live on the public site.";
    case ProblemStatus.ARCHIVED:
      return "Hidden from the public site, but kept for reference.";
    case ProblemStatus.DRAFT:
      return "Private and safe to keep editing.";
    default:
      return "Non-public status.";
  }
}

function formatStatus(status: ProblemStatus) {
  return formatEnumLabel(status);
}
