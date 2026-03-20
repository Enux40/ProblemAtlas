import { ProblemStatus } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { deleteProblem, updateProblemStatus } from "@/app/admin/problems/actions";
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
import { formatBuildTime, formatEnumLabel } from "@/lib/problem-presenters";
import { prisma } from "@/lib/prisma";

export default async function AdminProblemsPage() {
  const { data: problems, unavailable: databaseUnavailable } = await withDatabaseFallback(
    () =>
      prisma.problem.findMany({
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          status: true,
          demandScore: true,
          buildTimeValue: true,
          buildTimeUnit: true,
          updatedAt: true
        }
      }),
    []
  );

  const groupedCounts = {
    total: problems.length,
    published: problems.filter((problem) => problem.status === ProblemStatus.PUBLISHED).length,
    drafts: problems.filter((problem) => problem.status === ProblemStatus.DRAFT).length,
    archived: problems.filter((problem) => problem.status === ProblemStatus.ARCHIVED).length
  };

  return (
    <div className="space-y-8">
      {databaseUnavailable ? <DatabaseNotice compact /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-serif text-5xl">Problem manager</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Create new briefs, refine drafts, publish when ready, and archive older content
            without letting non-public states leak into the directory.
          </p>
        </div>
        <Button asChild>
          <Link href={"/admin/problems/new" as Route}>New problem</Link>
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-4xl">{groupedCounts.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-4xl">{groupedCounts.published}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Drafts</CardDescription>
            <CardTitle className="text-4xl">{groupedCounts.drafts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Archived</CardDescription>
            <CardTitle className="text-4xl">{groupedCounts.archived}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4">
        {databaseUnavailable ? (
          <Card>
            <CardHeader>
              <CardTitle>Problem manager unavailable</CardTitle>
              <CardDescription>
                Configure `DATABASE_URL` and restart the app before creating or editing content.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        {problems.map((problem) => (
          <Card key={problem.id} className="bg-card/85">
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  <span>{problem.category}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <Badge variant={getStatusBadgeVariant(problem.status)}>
                    {formatEnumLabel(problem.status)}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-3xl">{problem.title}</CardTitle>
                  <CardDescription className="mt-2">
                    /problems/{problem.slug}
                  </CardDescription>
                </div>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground sm:text-right">
                <span>Demand {problem.demandScore}</span>
                <span>{formatBuildTime(problem.buildTimeValue, problem.buildTimeUnit)}</span>
                <span>Updated {problem.updatedAt.toLocaleDateString()}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                {getStatusDescription(problem.status)}
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
                  <Button
                    type="submit"
                    disabled={problem.status === ProblemStatus.PUBLISHED}
                  >
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
              </div>
              <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href={`/admin/problems/${problem.id}/edit` as Route}>Edit</Link>
              </Button>
              {problem.status === ProblemStatus.PUBLISHED ? (
                <Button asChild variant="ghost">
                  <Link href={`/problems/${problem.slug}` as Route}>View live page</Link>
                </Button>
              ) : null}
              <form action={deleteProblem.bind(null, problem.id)}>
                <Button type="submit" variant="ghost" className="text-red-700 hover:text-red-800">
                  Delete
                </Button>
              </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
      return "Published problems are eligible for public homepage, directory, and detail-page queries.";
    case ProblemStatus.ARCHIVED:
      return "Archived problems stay editable in admin but are excluded from all public listings.";
    case ProblemStatus.DRAFT:
      return "Draft problems are private working copies and never appear in public queries.";
    default:
      return "This status is non-public and will not appear in the public directory.";
  }
}
