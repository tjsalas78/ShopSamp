"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandName } from "@/components/ui/BrandName";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div className="min-h-screen bg-surface-low flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <Link href="/" className="text-lg font-bold tracking-tight text-on-surface hover:opacity-80 transition-opacity"><BrandName /></Link>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-surface-variant bg-surface shadow-card">
        <div className="border-b border-surface-variant px-6 py-5">
          <h1 className="text-base font-semibold text-on-surface">Reset password</h1>
          <p className="mt-0.5 text-sm text-secondary">
            {submitted ? "Check your inbox" : "We'll send a reset link to your email"}
          </p>
        </div>
        <div className="px-6 py-5">
          {submitted ? (
            <div className="flex flex-col gap-6 py-2">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
                  <svg className="h-8 w-8 text-success" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.03 5.47a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 011.06-1.06l.97.97 2.97-2.97a.75.75 0 011.06 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-on-surface mb-2">Check your email</h2>
                  <p className="text-sm text-secondary leading-relaxed">
                    If <span className="font-medium text-on-surface">{email}</span> has an account with us, we've sent a password reset link to the inbox. It expires in 1 hour.
                  </p>
                  <p className="text-xs text-secondary mt-2">Didn't see it? Check your spam folder.</p>
                </div>
              </div>
              <Link href="/login" className="w-full">
                <Button className="w-full">
                  Back to sign in
                </Button>
              </Link>
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
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Send reset link
              </Button>
              <Link
                href="/login"
                className="text-center text-sm text-secondary hover:text-on-surface transition-colors"
              >
                ← Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
