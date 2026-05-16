import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combines clsx (conditional classes) with tailwind-merge (conflict resolution).
// Use instead of raw template literals for any conditional Tailwind className.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
