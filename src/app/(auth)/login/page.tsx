import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandName } from "@/components/ui/BrandName";
export const metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-low flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <Link href="/" className="text-lg font-bold tracking-tight text-on-surface hover:opacity-80 transition-opacity"><BrandName /></Link>
        <p className="mt-1 text-sm text-secondary">Sign in to your account</p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-surface-variant bg-surface shadow-card">
        <div className="border-b border-surface-variant px-6 py-5">
          <h1 className="text-base font-semibold text-on-surface">Welcome back</h1>
          <p className="mt-0.5 text-sm text-secondary">Sign in to continue</p>
        </div>
        <div className="px-6 py-5">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

    </div>
  );
}
