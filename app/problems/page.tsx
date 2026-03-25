import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { BuildTimeUnit, ProblemStatus, ProjectType, SkillLevel } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { ProblemsFilterForm } from "@/components/analytics/problems-filter-form";
import { TrackedLink } from "@/components/analytics/tracked-link";
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

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  skill?: string | string[];
  projectType?: string | string[];
  demand?: string | string[];
  buildTime?: string | string[];
  sort?: string | string[];
};

type ProblemsPageProps = {
  searchParams: Promise<SearchParams>;
};

const skillOptions = [
  { value: SkillLevel.BEGINNER, label: "Beginner" },
  { value: SkillLevel.INTERMEDIATE, label: "Intermediate" },
  { value: SkillLevel.ADVANCED, label: "Advanced" }
];

const projectTypeOptions = [
  { value: ProjectType.SAAS, label: "SaaS" },
  { value: ProjectType.INTERNAL_TOOL, label: "Internal tool" },
  { value: ProjectType.ANALYTICS, label: "Analytics" },
  { value: ProjectType.AUTOMATION, label: "Automation" },
  { value: ProjectType.MARKETPLACE, label: "Marketplace" },
  { value: ProjectType.DEVELOPER_TOOL, label: "Developer tool" },
  { value: ProjectType.MOBILE_APP, label: "Mobile app" },
  { value: ProjectType.SERVICE_BUSINESS_TOOL, label: "Service business tool" }
];

const demandOptions = [
  { value: "60", label: "60+ demand score" },
  { value: "70", label: "70+ demand score" },
  { value: "80", label: "80+ demand score" }
];

const buildTimeOptions = [
  { value: "quick", label: "Up to 4 weeks" },
  { value: "medium", label: "Up to 8 weeks" },
  { value: "extended", label: "Up to 12 weeks" }
];

const sortOptions = [
  { value: "featured", label: "Featured first" },
  { value: "demand", label: "Highest demand" },
  { value: "fastest", label: "Fastest to build" },
  { value: "recent", label: "Most recent" }
] as const;

export async function generateMetadata({
  searchParams
}: ProblemsPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const category = getSingleValue(resolvedSearchParams.category)?.trim() ?? "";
  const query = getSingleValue(resolvedSearchParams.q)?.trim() ?? "";
  const canonicalParams = new URLSearchParams();

  if (category) {
    canonicalParams.set("category", category);
  }

  const title = category
    ? `${category} Software Problems`
    : query
      ? `Search: ${query}`
      : "Problem Directory";
  const description = category
    ? `Browse curated ${category.toLowerCase()} software problems, demand signals, and practical MVP ideas.`
    : query
      ? `Search the ProblemAtlas directory for software problems related to ${query}.`
      : "Search the ProblemAtlas directory by category, skill level, demand, and build time.";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalParams.size > 0 ? `/problems?${canonicalParams.toString()}` : "/problems"
    },
    openGraph: {
      title: buildPageTitle(title),
      description,
      url: canonicalParams.size > 0 ? `/problems?${canonicalParams.toString()}` : "/problems",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: buildPageTitle(title),
      description
    }
  };
}

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSearchParams(params: SearchParams) {
  const q = getSingleValue(params.q)?.trim() ?? "";
  const category = getSingleValue(params.category)?.trim() ?? "";
  const skill = getSingleValue(params.skill)?.trim() ?? "";
  const projectType = getSingleValue(params.projectType)?.trim() ?? "";
  const demand = getSingleValue(params.demand)?.trim() ?? "";
  const buildTime = getSingleValue(params.buildTime)?.trim() ?? "";
  const sort = getSingleValue(params.sort)?.trim() ?? "featured";

  return { q, category, skill, projectType, demand, buildTime, sort };
}

function isSkillLevel(value: string): value is SkillLevel {
  return Object.values(SkillLevel).includes(value as SkillLevel);
}

function isProjectType(value: string): value is ProjectType {
  return Object.values(ProjectType).includes(value as ProjectType);
}

function getBuildTimeWhere(buildTime: string): Prisma.ProblemWhereInput | undefined {
  switch (buildTime) {
    case "quick":
      return {
        OR: [
          { buildTimeUnit: BuildTimeUnit.DAYS, buildTimeValue: { lte: 28 } },
          { buildTimeUnit: BuildTimeUnit.WEEKS, buildTimeValue: { lte: 4 } }
        ]
      };
    case "medium":
      return {
        OR: [
          { buildTimeUnit: BuildTimeUnit.DAYS, buildTimeValue: { lte: 56 } },
          { buildTimeUnit: BuildTimeUnit.WEEKS, buildTimeValue: { lte: 8 } },
          { buildTimeUnit: BuildTimeUnit.MONTHS, buildTimeValue: { lte: 2 } }
        ]
      };
    case "extended":
      return {
        OR: [
          { buildTimeUnit: BuildTimeUnit.DAYS, buildTimeValue: { lte: 84 } },
          { buildTimeUnit: BuildTimeUnit.WEEKS, buildTimeValue: { lte: 12 } },
          { buildTimeUnit: BuildTimeUnit.MONTHS, buildTimeValue: { lte: 3 } }
        ]
      };
    default:
      return undefined;
  }
}

function getOrderBy(sort: string): Prisma.ProblemOrderByWithRelationInput[] {
  switch (sort) {
    case "demand":
      return [{ demandScore: "desc" }, { featured: "desc" }, { publishedAt: "desc" }];
    case "recent":
      return [{ publishedAt: "desc" }, { featured: "desc" }];
    case "featured":
    default:
      return [{ featured: "desc" }, { demandScore: "desc" }, { publishedAt: "desc" }];
  }
}

function getBuildTimeRank(value: number, unit: BuildTimeUnit) {
  switch (unit) {
    case BuildTimeUnit.DAYS:
      return value;
    case BuildTimeUnit.WEEKS:
      return value * 7;
    case BuildTimeUnit.MONTHS:
      return value * 30;
    default:
      return value;
  }
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeSearchParams(resolvedSearchParams);
  const demandValue = Number(filters.demand);
  const activeDemand = Number.isFinite(demandValue) ? demandValue : undefined;

  const where: Prisma.ProblemWhereInput = {
    status: ProblemStatus.PUBLISHED,
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { tagline: { contains: filters.q, mode: "insensitive" } },
            { excerpt: { contains: filters.q, mode: "insensitive" } },
            { summary: { contains: filters.q, mode: "insensitive" } },
            { category: { contains: filters.q, mode: "insensitive" } },
            { targetUser: { contains: filters.q, mode: "insensitive" } }
          ]
        }
      : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.skill && isSkillLevel(filters.skill)
      ? { recommendedSkill: filters.skill }
      : {}),
    ...(filters.projectType && isProjectType(filters.projectType)
      ? { projectTypes: { has: filters.projectType } }
      : {}),
    ...(activeDemand ? { demandScore: { gte: activeDemand } } : {})
  };

  const buildTimeWhere = getBuildTimeWhere(filters.buildTime);
  const queryWhere = buildTimeWhere ? { AND: [where, buildTimeWhere] } : where;

  const { data } = await withDatabaseFallback(
    async () =>
      Promise.all([
        prisma.problem.findMany({
          where: { status: ProblemStatus.PUBLISHED },
          select: { category: true },
          distinct: ["category"],
          orderBy: { category: "asc" }
        }),
        prisma.problem.findMany({
          where: {
            status: ProblemStatus.PUBLISHED,
            featured: true
          },
          select: {
            id: true,
            slug: true,
            title: true,
            category: true
          },
          orderBy: [{ demandScore: "desc" }, { publishedAt: "desc" }],
          take: 3
        }),
        prisma.problem.findMany({
          where: queryWhere,
          select: {
            id: true,
            slug: true,
            title: true,
            tagline: true,
            excerpt: true,
            category: true,
            recommendedSkill: true,
            projectTypes: true,
            demandScore: true,
            buildTimeValue: true,
            buildTimeUnit: true,
            featured: true,
            tags: {
              select: {
                id: true,
                name: true
              },
              take: 3
            }
          },
          orderBy: getOrderBy(filters.sort)
        })
      ]),
    [[], [], []]
  );
  const [categories, featuredProblems, problems] = data;

  const categoryOptions = categories.map((item) => item.category);
  const sortedProblems =
    filters.sort === "fastest"
      ? [...problems].sort((left, right) => {
          const buildTimeDifference =
            getBuildTimeRank(left.buildTimeValue, left.buildTimeUnit) -
            getBuildTimeRank(right.buildTimeValue, right.buildTimeUnit);

          if (buildTimeDifference !== 0) {
            return buildTimeDifference;
          }

          return right.demandScore - left.demandScore;
        })
      : problems;
  const activeFilterCount = [
    filters.q,
    filters.category,
    filters.skill,
    filters.projectType,
    filters.demand,
    filters.buildTime
  ].filter(Boolean).length;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Directory"
        title="Search the curated problem directory"
        description="Filter by audience fit, build scope, demand strength, and sort order to find briefs that match what you actually want to build."
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit bg-background/75">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Filters</CardTitle>
                <CardDescription>
                  Lightweight controls with shareable URL state.
                </CardDescription>
              </div>
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                  {activeFilterCount} active
                </span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <ProblemsFilterForm>
              <label className="grid gap-2">
                <span className="text-sm font-medium">Search</span>
                <input
                  type="search"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search titles, audiences, and summaries"
                  className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Sort by</span>
                <select
                  name="sort"
                  defaultValue={filters.sort}
                  className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Category</span>
                <select
                  name="category"
                  defaultValue={filters.category}
                  className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
                >
                  <option value="">All categories</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Skill level</span>
                <select
                  name="skill"
                  defaultValue={filters.skill}
                  className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
                >
                  <option value="">Any skill level</option>
                  {skillOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Project type</span>
                <select
                  name="projectType"
                  defaultValue={filters.projectType}
                  className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
                >
                  <option value="">Any project type</option>
                  {projectTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Demand score</span>
                <select
                  name="demand"
                  defaultValue={filters.demand}
                  className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
                >
                  <option value="">Any demand level</option>
                  {demandOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Estimated build time</span>
                <select
                  name="buildTime"
                  defaultValue={filters.buildTime}
                  className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition focus:border-accent"
                >
                  <option value="">Any timeline</option>
                  {buildTimeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit">Apply filters</Button>
                <Button asChild type="button" variant="outline">
                  <Link href={"/problems" as Route}>Clear all</Link>
                </Button>
              </div>
            </ProblemsFilterForm>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {featuredProblems.length > 0 && activeFilterCount === 0 ? (
            <Card className="bg-card/88">
              <CardHeader className="gap-4">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  <span className="text-accent">Featured now</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>Editorial picks</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {featuredProblems.map((problem) => (
                    <TrackedLink
                      key={problem.id}
                      href={`/problems/${problem.slug}` as Route}
                      eventName="problem_card_click"
                      eventPayload={{
                        slug: problem.slug,
                        title: problem.title,
                        category: problem.category,
                        placement: "directory_featured_strip"
                      }}
                      className="rounded-[1.25rem] border border-border/70 bg-background/65 px-4 py-4 transition hover:border-accent/40 hover:bg-background"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {problem.category}
                      </p>
                      <p className="mt-3 font-serif text-2xl">{problem.title}</p>
                    </TrackedLink>
                  ))}
                </div>
              </CardHeader>
            </Card>
          ) : null}

          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/80 bg-background/70 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                Results
              </p>
              <h2 className="mt-2 font-serif text-3xl">
                {sortedProblems.length} published {sortedProblems.length === 1 ? "problem" : "problems"}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Sorted by{" "}
              {sortOptions.find((option) => option.value === filters.sort)?.label.toLowerCase() ??
                "featured first"}
              . Refresh-safe and shareable by URL.
            </p>
          </div>

          {sortedProblems.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No matching problems</CardTitle>
                <CardDescription>
                  Nothing fits this exact slice right now. Try broadening one or two filters,
                  or reset to return to the wider directory.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <Badge>Try removing demand</Badge>
                  <Badge>Widen build time</Badge>
                  <Badge>Clear project type</Badge>
                </div>
                <Button asChild variant="outline">
                  <Link href={"/problems" as Route}>Reset filters</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5">
              {sortedProblems.map((problem) => (
                <Card key={problem.id} className="bg-card/85">
                  <CardHeader className="gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      <span>{problem.category}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{formatEnumLabel(problem.recommendedSkill)}</span>
                      {problem.featured ? (
                        <>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <Badge variant="accent">
                            Featured
                          </Badge>
                        </>
                      ) : null}
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
                            placement: "directory_card_title"
                          }}
                          className="transition hover:text-accent"
                        >
                          {problem.title}
                        </TrackedLink>
                      </CardTitle>
                      <p className="text-lg text-foreground/85">{problem.tagline}</p>
                      <CardDescription className="max-w-3xl text-sm leading-7">
                        {problem.excerpt}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {problem.projectTypes.slice(0, 2).map((type) => (
                        <Badge key={type} variant="outline">
                          {formatEnumLabel(type)}
                        </Badge>
                      ))}
                      {problem.tags.map((tag) => (
                        <Badge key={tag.id}>
                          {tag.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
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
                      <div className="rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          Path
                        </p>
                        <TrackedLink
                          href={`/problems/${problem.slug}` as Route}
                          eventName="problem_card_click"
                          eventPayload={{
                            slug: problem.slug,
                            title: problem.title,
                            category: problem.category,
                            placement: "directory_card_cta"
                          }}
                          className="mt-2 block text-2xl font-semibold transition hover:text-accent"
                        >
                          Open brief
                        </TrackedLink>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
