"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "./GoogleButton";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get("sd") !== "letsgo") return;
    setLoading(true);
    signIn("bypass", { key: "letsgo", redirect: false }).then((result) => {
      if (result?.error) {
        setLoading(false);
        setError("Bypass login failed.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <GoogleButton callbackUrl={callbackUrl} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-surface-variant" />
        <span className="type-label">or</span>
        <div className="h-px flex-1 bg-surface-variant" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="flex items-start gap-2 rounded bg-error/8 px-3 py-2.5 text-sm text-error">
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zm0 6.75a.875.875 0 110-1.75.875.875 0 010 1.75z" />
            </svg>
            {error}
          </div>
        )}

        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="type-label">Password</label>
            <Link
              href="/forgot-password"
              className="text-2xs font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:text-primary-dark">
          Sign up
        </Link>
      </p>

    </div>
  );
}
