import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { buildPageTitle, getSiteUrl, siteDescription, siteName } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  description: siteDescription,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    siteName,
    title: buildPageTitle(),
    description: siteDescription,
    url: "/"
  },
  twitter: {
    card: "summary_large_image",
    title: buildPageTitle(),
    description: siteDescription
  }
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/problems", label: "Problems" },
  { href: "/admin", label: "Admin" }
] satisfies ReadonlyArray<{ href: Route; label: string }>;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <div className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-paper-grid bg-[size:36px_36px] opacity-30" />
          <div className="absolute left-1/2 top-0 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
          <div className="container flex min-h-screen flex-col py-6 sm:py-8">
            <header className="flex items-center justify-between rounded-full border border-border/80 bg-background/80 px-5 py-3 backdrop-blur">
              <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
                ProblemAtlas
              </Link>
              <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-2 transition hover:bg-secondary hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </header>
            <main className="flex-1 py-10 sm:py-14">{children}</main>
            <footer className="border-t border-border/70 py-6 text-sm text-muted-foreground">
              Curated product problems for developers who want clearer bets.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
