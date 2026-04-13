import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getTokenExpiry(hours = 1): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
