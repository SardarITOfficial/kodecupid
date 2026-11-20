import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and lets later utilities win. Without this, a component's
 * default (`bg-white`, `p-5`) and a caller's override (`bg-navy`, `p-0`) both
 * land in the stylesheet and the one Tailwind emits last wins — which is not the
 * one written last.
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return twMerge(inputs.filter(Boolean).join(' '));
}
