import { Suspense } from "react";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { BrandName } from "@/components/ui/BrandName";
export const metadata = { title: "Create Account" };

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-surface-low flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <Link href="/" className="text-lg font-bold tracking-tight text-on-surface hover:opacity-80 transition-opacity"><BrandName /></Link>
        <p className="mt-1 text-sm text-secondary">Create your account</p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-surface-variant bg-surface shadow-card">
        <div className="border-b border-surface-variant px-6 py-5">
          <h1 className="text-base font-semibold text-on-surface">Get started</h1>
          <p className="mt-0.5 text-sm text-secondary">Sign up to start listing</p>
        </div>
        <div className="px-6 py-5">
          <Suspense>
            <SignupForm />
          </Suspense>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-semibold">
          Sign in
        </Link>
      </div>
    </div>
  );
}
