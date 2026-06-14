import type { Metadata } from "next";
import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in or create an account to continue.</CardDescription>
        </CardHeader>
        <form>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
          </CardContent>
          <CardFooter className="mt-6 flex-col gap-2">
            <Button type="submit" formAction={login} className="w-full">
              Sign in
            </Button>
            <Button type="submit" formAction={signup} variant="outline" className="w-full">
              Create account
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
