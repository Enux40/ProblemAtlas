import type { Metadata } from "next";
import { ProblemStatus } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, ChartColumn, Compass, FileStack } from "lucide-react";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { DatabaseNotice } from "@/components/database-notice";
import { NewsletterSignupForm } from "@/components/newsletter-signup-form";
import { SectionHeading } from "@/components/section-heading";
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
import { buildPageTitle } from "@/lib/seo";

const pillars = [
  {
    title: "Clear demand signals",
    description:
      "Every problem starts with why it matters, who feels it, and what evidence makes it worth exploring.",
    icon: ChartColumn
  },
  {
    title: "Editorial curation",
    description:
      "We prioritize sober opportunities over hype, with honest notes on risks, tradeoffs, and positioning.",
    icon: Compass
  },
  {
    title: "Buildable MVPs",
    description:
      "Each brief points toward a practical first version so developers can move from insight to execution.",
    icon: FileStack
  }
];

export const metadata: Metadata = {
  title: "Find Software Problems Worth Solving",
  description:
    "Explore curated software problems, demand signals, and practical MVP directions for developers, freelancers, and indie makers.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: buildPageTitle("Find Software Problems Worth Solving"),
    description:
      "Explore curated software problems, demand signals, and practical MVP directions for developers, freelancers, and indie makers.",
    url: "/",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: buildPageTitle("Find Software Problems Worth Solving"),
    description:
      "Explore curated software problems, demand signals, and practical MVP directions for developers, freelancers, and indie makers."
  }
};

export default async function HomePage() {
  const { data, unavailable: databaseUnavailable } = await withDatabaseFallback(
    async () =>
      Promise.all([
        prisma.problem.findMany({
          where: {
            status: ProblemStatus.PUBLISHED,
            featured: true
          },
          select: {
            id: true,
            slug: true,
            title: true,
            tagline: true,
            excerpt: true,
            category: true,
            recommendedSkill: true,
            demandScore: true,
            buildTimeValue: true,
            buildTimeUnit: true,
            tags: {
              select: {
                id: true,
                name: true
              },
              take: 2
            }
          },
          orderBy: [{ demandScore: "desc" }, { publishedAt: "desc" }],
          take: 3
        }),
        prisma.problem.aggregate({
          where: {
            status: ProblemStatus.PUBLISHED
          },
          _count: {
            _all: true
          },
          _avg: {
            demandScore: true
          }
        })
      ]),
    [
      [],
      {
        _count: { _all: 0 },
        _avg: { demandScore: null }
      }
    ]
  );
  const [featuredProblems, stats] = data;

  return (
    <div className="space-y-20">
      {databaseUnavailable ? <DatabaseNotice /> : null}
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-border/80 bg-background/85 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Editorial software problem library
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-6xl leading-none sm:text-7xl">
              Find software problems that are actually worth building for.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              ProblemAtlas helps developers move past random side projects with a
              curated read on real-world pain, demand signals, and credible MVP
              directions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={"/problems" as Route}>
                Browse problems
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={"/admin" as Route}>Open admin</Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-primary/10 bg-card/90">
          <CardHeader>
            <CardDescription>Featured note</CardDescription>
            <CardTitle className="max-w-sm text-3xl">
              Strong product ideas usually begin with a boring, persistent workflow problem.
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 border-t border-border/80 pt-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Published
                </p>
                <p className="mt-2 text-3xl font-semibold">{stats._count._all}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Avg. demand
                </p>
                <p className="mt-2 text-3xl font-semibold">
                  {Math.round(stats._avg.demandScore ?? 0)}
                </p>
              </div>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              Lightweight briefs, stronger signal, and less random project drift.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Why it works"
          title="A sharper way to choose what to build next"
          description="Pick problems with real users, visible friction, and enough room for a believable first product."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="bg-background/70">
              <CardHeader>
                <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription className="text-sm leading-7">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Featured problems"
            title="A few strong places to start"
            description="High-signal briefs with practical scope and visible demand."
          />
          <Button asChild variant="outline">
            <Link href={"/problems?sort=featured" as Route}>View featured directory</Link>
          </Button>
        </div>

        {featuredProblems.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No featured briefs yet</CardTitle>
              <CardDescription>
                The directory is ready. Featured selections will surface here once they are
                marked in admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href={"/problems" as Route}>Browse all problems</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {featuredProblems.map((problem, index) => (
              <Card key={problem.id} className="flex h-full flex-col bg-card/88">
                <CardHeader className="gap-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{problem.category}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="text-accent">Featured</span>
                  </div>
                  <div className="space-y-3">
                    <CardTitle className="text-3xl">
                      <TrackedLink
                        href={`/problems/${problem.slug}` as Route}
                        eventName="problem_card_click"
                        eventPayload={{
                          slug: problem.slug,
                          title: problem.title,
                          category: problem.category,
                          placement: "homepage_featured"
                        }}
                        className="transition hover:text-accent"
                      >
                        {problem.title}
                      </TrackedLink>
                    </CardTitle>
                    <p className="text-base leading-7 text-foreground/85">{problem.tagline}</p>
                    <CardDescription className="leading-7">{problem.excerpt}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {formatEnumLabel(problem.recommendedSkill)}
                    </Badge>
                    {problem.tags.map((tag) => (
                      <Badge key={tag.id}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Demand
                      </p>
                      <p className="mt-2 text-2xl font-semibold">{problem.demandScore}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Build time
                      </p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatBuildTime(problem.buildTimeValue, problem.buildTimeUnit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <Card className="bg-card/88">
          <CardContent className="pt-6">
            <NewsletterSignupForm
              source="homepage"
              interests={["Homepage", "Featured Problems"]}
              title="Get the next strong brief in your inbox"
              description="New featured problems, editorial picks, and a few worth-your-time opportunities. No noisy drip sequence."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
