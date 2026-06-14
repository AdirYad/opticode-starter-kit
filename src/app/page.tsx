import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  { title: "Next.js 16", description: "App Router, React 19, Turbopack." },
  { title: "Supabase + Drizzle", description: "Postgres, Auth, and type-safe SQL." },
  { title: "shadcn/ui", description: "Accessible components on your tokens." },
  { title: "Vercel AI Gateway", description: "One key, every model." },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <section className="space-y-6">
        <span className="bg-primary/10 text-primary inline-flex rounded-full px-3 py-1 text-sm font-medium">
          Opticode Starter
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Ship a real product, <span className="text-primary">without the boilerplate</span>.
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg text-pretty">
          A production-grade foundation wired end to end: database, auth, UI, and AI. Clone it,
          fill in your <code className="bg-muted rounded px-1 py-0.5 text-sm">.env</code>, and
          build.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/dashboard">Open dashboard</Link>} size="lg" />
          <Button render={<Link href="/login">Sign in</Link>} size="lg" variant="outline" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle className="text-base">{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
