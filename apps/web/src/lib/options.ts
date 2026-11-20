import type { ChipOption } from '@/components/ui/chips';

export function optionsFrom<T extends string>(labels: Record<T, string>): ChipOption<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }));
}
