"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passcode }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.message ?? "Login gagal.");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      router.replace(getSafeNextPath(params.get("next")));
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server auth.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-md shadow-none">
        <CardHeader>
          <p className="text-sm font-semibold text-primary">
            Serbajaya Elektronik
          </p>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <LockKeyhole className="size-5 text-primary" />
            Masuk ke POS Warung
          </CardTitle>
          <p className="text-sm font-medium leading-6 text-muted-foreground">
            Akses kasir dan database dikunci dengan passcode warung.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Passcode</Label>
              <Input
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                autoFocus
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription className="font-semibold">
                  {error}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              disabled={loading || passcode.trim().length === 0}
              className="h-11 w-full"
            >
              {loading ? "Memeriksa..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
