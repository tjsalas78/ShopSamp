"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandName } from "@/components/ui/BrandName";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded bg-error/8 px-3 py-2.5 text-sm text-error">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zm0 6.75a.875.875 0 110-1.75.875.875 0 010 1.75z" />
          </svg>
          Invalid reset link.{" "}
          <Link href="/forgot-password" className="underline font-medium">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {success ? (
        <div className="flex items-start gap-2 rounded bg-primary/8 px-3 py-2.5 text-sm text-primary">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.03 5.47a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 011.06-1.06l.97.97 2.97-2.97a.75.75 0 011.06 0z" />
          </svg>
          Password updated! Redirecting to sign in…
        </div>
      ) : (
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
            id="password"
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <Input
            id="confirm"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Set new password
          </Button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-surface-low flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <Link href="/" className="text-lg font-bold tracking-tight text-on-surface hover:opacity-80 transition-opacity"><BrandName /></Link>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-surface-variant bg-surface shadow-card">
        <div className="border-b border-surface-variant px-6 py-5">
          <h1 className="text-base font-semibold text-on-surface">Set new password</h1>
          <p className="mt-0.5 text-sm text-secondary">Choose a strong password</p>
        </div>
        <div className="px-6 py-5">
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
