import { LockKeyhole, PencilRuler, SquarePen } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { LoginForm } from "@/components/admin/login-form";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/section-heading";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { isDatabaseConfigured, withDatabaseFallback } from "@/lib/database";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const adminAreas = [
  {
    title: "Authentication",
    description: "Reserve this area for secure editor access and session handling.",
    icon: LockKeyhole
  },
  {
    title: "Problem management",
    description: "Create, edit, draft, and publish curated problem entries.",
    icon: SquarePen
  },
  {
    title: "Evidence and metadata",
    description: "Organize tags, stacks, references, and supporting research notes.",
    icon: PencilRuler
  }
];

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-3xl space-y-10">
        <SectionHeading
          eyebrow="Admin"
          title="Editorial sign in"
          description="Use the configured admin credentials to manage ProblemAtlas content."
          align="center"
        />
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Protected admin access</CardTitle>
            <CardDescription>
              After sign-in, you can create, edit, publish, and remove problem briefs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: counts } = await withDatabaseFallback(
    () =>
      Promise.all([
        prisma.problem.count(),
        prisma.problem.count({
          where: {
            status: "PUBLISHED"
          }
        })
      ]),
    [0, 0]
  );
  const [problemCount, publishedCount] = counts;

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Admin"
        title="Editorial workspace"
        description="Manage the curated directory, shape drafts, and keep editorial quality high."
      />
      {!isDatabaseConfigured() ? (
        <Card>
          <CardHeader>
            <CardTitle>Database setup required</CardTitle>
            <CardDescription>
              Admin sign-in works, but problem counts and CRUD actions need `DATABASE_URL`
              configured before they can read or save content.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Total problems</CardDescription>
            <CardTitle className="text-4xl">{problemCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published briefs</CardDescription>
            <CardTitle className="text-4xl">{publishedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {adminAreas.map(({ title, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
                <Icon className="size-5" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="leading-7">{description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              {title === "Problem management" ? (
                <Button asChild variant="outline">
                  <Link href={"/admin/problems" as Route}>Open problem manager</Link>
                </Button>
              ) : (
                "Reserved for future editorial tooling."
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <form action={logoutAdmin}>
        <Button type="submit" variant="ghost">
          Sign out
        </Button>
      </form>
    </div>
  );
}
