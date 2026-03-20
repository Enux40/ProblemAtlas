import Link from "next/link";
import type { Route } from "next";

type DatabaseNoticeProps = {
  compact?: boolean;
};

export function DatabaseNotice({ compact = false }: DatabaseNoticeProps) {
  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900"
          : "rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900"
      }
    >
      The app is running, but the database is not configured yet. Add `DATABASE_URL` in your local
      env and restart the dev server to load live content. You can use `.env.example` as the
      starting point, or keep browsing the fallback UI.
      {" "}
      <Link href={"/admin" as Route} className="font-medium underline underline-offset-4">
        Admin
      </Link>
      {" "}
      will also need the database before CRUD actions can save content.
    </div>
  );
}
