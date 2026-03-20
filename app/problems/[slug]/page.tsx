import type { Metadata } from "next";
import { MonetizationType, ProblemStatus } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProblemDetailViewTracker } from "@/components/analytics/problem-detail-view-tracker";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { DatabaseNotice } from "@/components/database-notice";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
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
import {
  formatBuildTime,
  formatEnumLabel,
  getMonetizationIdea
} from "@/lib/problem-presenters";
import { prisma } from "@/lib/prisma";
import { matchRelatedProblems } from "@/lib/related-problems";
import { buildPageTitle } from "@/lib/seo";

type ProblemDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const scoreConfig = [
  { key: "demandScore", label: "Demand" },
  { key: "difficultyScore", label: "Difficulty" },
  { key: "monetizationScore", label: "Monetization" },
  { key: "validationScore", label: "Validation" },
  { key: "editorialScore", label: "Editorial" }
] as const;

async function getProblem(slug: string) {
  return prisma.problem.findFirst({
    where: {
      slug,
      status: ProblemStatus.PUBLISHED
    },
    include: {
      evidences: {
        orderBy: [{ signalStrength: "desc" }, { capturedAt: "desc" }]
      },
      stacks: {
        orderBy: { name: "asc" }
      },
      tags: {
        orderBy: { name: "asc" }
      }
    }
  });
}

export async function generateMetadata({
  params
}: ProblemDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: problem } = await withDatabaseFallback(
    () =>
      prisma.problem.findFirst({
        where: {
          slug,
          status: ProblemStatus.PUBLISHED
        },
        select: {
          title: true,
          excerpt: true,
          category: true
        }
      }),
    null
  );

  if (!problem) {
    return {
      title: "Problem not found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return {
    title: problem.title,
    description: problem.excerpt,
    alternates: {
      canonical: `/problems/${slug}`
    },
    openGraph: {
      title: buildPageTitle(problem.title),
      description: problem.excerpt,
      url: `/problems/${slug}`,
      type: "article",
      section: problem.category
    },
    twitter: {
      card: "summary_large_image",
      title: buildPageTitle(problem.title),
      description: problem.excerpt
    }
  };
}

export default async function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const { slug } = await params;
  const { data: problem, unavailable: databaseUnavailable } = await withDatabaseFallback(
    () => getProblem(slug),
    null
  );

  if (!problem) {
    if (databaseUnavailable) {
      return (
        <div className="space-y-6">
          <Link
            href={"/problems" as Route}
            className="inline-flex text-sm font-medium text-muted-foreground transition hover:text-accent"
          >
            Back to directory
          </Link>
          <DatabaseNotice />
          <Card>
            <CardHeader>
              <CardTitle>Problem detail is unavailable</CardTitle>
              <CardDescription>
                This page needs database content to load the selected brief.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }

    notFound();
  }

  const { data: relatedProblemCandidates } = await withDatabaseFallback(
    () =>
      prisma.problem.findMany({
        where: {
          status: ProblemStatus.PUBLISHED,
          id: {
            not: problem.id
          },
          OR: [
            { category: problem.category },
            {
              tags: {
                some: {
                  id: {
                    in: problem.tags.map((tag) => tag.id)
                  }
                }
              }
            },
            {
              projectTypes: {
                hasSome: problem.projectTypes
              }
            }
          ]
        },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          category: true,
          projectTypes: true,
          demandScore: true,
          difficultyScore: true,
          monetizationScore: true,
          tags: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: [{ demandScore: "desc" }, { publishedAt: "desc" }],
        take: 18
      }),
    []
  );
  const relatedProblems = matchRelatedProblems(problem, relatedProblemCandidates);

  const monetizationTypes = problem.monetizationTypes.length
    ? problem.monetizationTypes
    : [MonetizationType.SUBSCRIPTION];

  return (
    <div className="space-y-10">
      <ProblemDetailViewTracker
        slug={problem.slug}
        title={problem.title}
        category={problem.category}
      />
      <div className="space-y-6">
        <Link
          href="/problems"
          className="inline-flex text-sm font-medium text-muted-foreground transition hover:text-accent"
        >
          Back to directory
        </Link>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <Card className="overflow-hidden bg-card/85">
            <CardHeader className="space-y-5 border-b border-border/70 pb-8">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                <span>{problem.category}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{formatEnumLabel(problem.recommendedSkill)}</span>
                {problem.featured ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="text-accent">Featured</span>
                  </>
                ) : null}
              </div>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-5xl sm:text-6xl">{problem.title}</h1>
                <p className="max-w-3xl text-xl leading-8 text-foreground/85">
                  {problem.tagline}
                </p>
                <CardDescription className="max-w-3xl text-base leading-8">
                  {problem.summary}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-8 pt-8 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="space-y-8">
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Summary
                  </p>
                  <p className="text-base leading-8 text-foreground/85">{problem.description}</p>
                </section>

                <section className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                      Target user
                    </p>
                    <p className="leading-8 text-foreground/85">{problem.targetUser}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                      Core pain
                    </p>
                    <p className="leading-8 text-foreground/85">{problem.painPoint}</p>
                  </div>
                </section>

                <section className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    Suggested MVP
                  </p>
                  <Card className="bg-background/65">
                    <CardContent className="pt-6">
                      <p className="leading-8 text-foreground/85">{problem.suggestedMvp}</p>
                    </CardContent>
                  </Card>
                </section>
              </div>

              <aside className="space-y-4">
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Estimated build
                  </p>
                  <p className="mt-3 text-3xl font-semibold">
                    {formatBuildTime(problem.buildTimeValue, problem.buildTimeUnit)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Industry
                  </p>
                  <p className="mt-3 text-xl font-semibold">{problem.industry ?? "General"}</p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Company size
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    {problem.companySize ?? "Flexible"}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-border/70 bg-background/70 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Geography
                  </p>
                  <p className="mt-3 text-xl font-semibold">
                    {problem.geographyFocus ?? "Global"}
                  </p>
                </div>
              </aside>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="bg-background/75">
              <CardHeader>
                <CardTitle>Scores</CardTitle>
                <CardDescription>
                  A quick editorial read on demand, build scope, and commercial fit.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {scoreConfig.map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-xl font-semibold">
                      {problem[key]}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-background/75">
              <CardHeader>
                <CardTitle>Demand signal</CardTitle>
                <CardDescription>{problem.demandSignalsSummary}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="bg-card/85">
            <CardHeader>
              <CardTitle>Evidence</CardTitle>
              <CardDescription>
                Source material and demand signals behind the brief.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {problem.evidences.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/55 p-5 text-sm leading-7 text-muted-foreground">
                  No evidence entries have been attached yet. This brief is still best read as
                  an editorial starting point rather than a fully sourced dossier.
                </div>
              ) : (
                problem.evidences.map((evidence) => (
                  <div
                    key={evidence.id}
                    className="rounded-[1.25rem] border border-border/70 bg-background/65 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      <span>{formatEnumLabel(evidence.sourceType)}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{evidence.sourceName}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>Signal {evidence.signalStrength}/5</span>
                    </div>
                    <h2 className="mt-4 text-2xl">{evidence.title}</h2>
                    <p className="mt-3 leading-7 text-foreground/85">{evidence.summary}</p>
                    {evidence.snippet ? (
                      <p className="mt-3 rounded-2xl bg-secondary/60 px-4 py-3 text-sm leading-7 text-muted-foreground">
                        {evidence.snippet}
                      </p>
                    ) : null}
                    {evidence.sourceUrl ? (
                      <a
                        href={evidence.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex text-sm font-medium text-accent transition hover:text-accent/80"
                      >
                        View source
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Recommended stack</CardTitle>
                <CardDescription>
                  Technical ingredients that fit the first credible version.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {problem.stacks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/55 px-4 py-4 text-sm leading-7 text-muted-foreground">
                    No stack suggestions yet. This may still be a strong problem, but the
                    recommended implementation path has not been curated.
                  </div>
                ) : (
                  problem.stacks.map((stack) => (
                    <div
                      key={stack.id}
                      className="rounded-2xl border border-border/70 bg-background/65 px-4 py-3"
                    >
                      <p className="text-sm font-medium">{stack.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{stack.description}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/85">
              <CardHeader>
                <CardTitle>Monetization ideas</CardTitle>
                <CardDescription>
                  Commercial directions suggested by the workflow and buyer profile.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {monetizationTypes.map((type) => (
                  <div
                    key={type}
                    className="rounded-2xl border border-border/70 bg-background/65 px-4 py-3"
                  >
                    <p className="text-sm font-medium">{formatEnumLabel(type)}</p>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      {getMonetizationIdea(type)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/85">
            <CardHeader>
              <CardTitle>Risks and caveats</CardTitle>
              <CardDescription>
                Honest reasons this might be harder than it looks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-8 text-foreground/85">{problem.riskNotes}</p>
              <div className="flex flex-wrap gap-2">
                {problem.tags.map((tag) => (
                  <Badge key={tag.id}>
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/85">
            <CardContent className="pt-6">
              <NewsletterSignupForm
                source={`problem:${problem.slug}`}
                interests={[problem.category, problem.title]}
                compact
                title="Get similar briefs by email"
                description="Useful if you want more problems in this lane without checking back manually."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-background/75">
            <CardHeader>
              <CardTitle>Related problems</CardTitle>
              <CardDescription>
                Nearby briefs in the same category or editorial neighborhood.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {relatedProblems.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/55 p-4 text-sm leading-7 text-muted-foreground">
                  No close neighbors surfaced yet. Try the wider directory for adjacent categories.
                </div>
              ) : (
                relatedProblems.map((relatedProblem) => (
                  <TrackedLink
                    key={relatedProblem.id}
                    href={`/problems/${relatedProblem.slug}` as Route}
                    eventName="problem_card_click"
                    eventPayload={{
                      slug: relatedProblem.slug,
                      title: relatedProblem.title,
                      category: relatedProblem.category,
                      placement: "problem_detail_related"
                    }}
                    className="rounded-[1.25rem] border border-border/70 bg-background/65 p-4 transition hover:border-accent/40 hover:bg-background"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {relatedProblem.category} / Match {relatedProblem.matchScore}
                    </p>
                    <p className="mt-3 font-serif text-2xl">{relatedProblem.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {relatedProblem.excerpt}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {relatedProblem.matchReasons.map((reason) => (
                        <Badge key={reason} variant="outline">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </TrackedLink>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-background/75">
            <CardHeader>
              <CardTitle>Keep exploring</CardTitle>
              <CardDescription>
                Return to the directory to compare adjacent opportunities and filter by fit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={"/problems" as Route}>Browse all problems</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
