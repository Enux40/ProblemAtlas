import { ProblemStatus } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { deleteProblem } from "@/app/admin/problems/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { formatBuildTime, formatEnumLabel } from "@/lib/problem-presenters";
import { prisma } from "@/lib/prisma";

export default async function AdminProblemsPage() {
  const problems = await prisma.problem.findMany({
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
  });

  const groupedCounts = {
    total: problems.length,
    published: problems.filter((problem) => problem.status === ProblemStatus.PUBLISHED).length,
    drafts: problems.filter((problem) => problem.status === ProblemStatus.DRAFT).length
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Admin
          </p>
          <h1 className="mt-2 font-serif text-5xl">Problem manager</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Create new briefs, refine existing drafts, and keep published problems current.
          </p>
        </div>
        <Button asChild>
          <Link href={"/admin/problems/new" as Route}>New problem</Link>
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
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
      </div>

      <div className="grid gap-4">
        {problems.map((problem) => (
          <Card key={problem.id} className="bg-card/85">
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  <span>{problem.category}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>{formatEnumLabel(problem.status)}</span>
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
            <CardContent className="flex flex-wrap gap-3">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
