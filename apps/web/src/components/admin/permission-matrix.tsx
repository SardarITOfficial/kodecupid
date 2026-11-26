"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MatrixColumn = { key: string; label: string };

export type MatrixRow = {
  id: string;
  label: string;
  icon?: ReactNode;
  supports?: string[];
};

export type MatrixGroup = {
  id: string;
  label: string;
  columns: MatrixColumn[];
  rows: MatrixRow[];
};

export type MatrixValue = Record<string, boolean>;

export const cellKey = (rowId: string, columnKey: string) => `${rowId}:${columnKey}`;

type Props = {
  groups: MatrixGroup[];
  value: MatrixValue;
  onChange: (key: string, next: boolean) => void;
  disabled?: boolean;
};

const GRID = "grid grid-cols-[minmax(180px,1.6fr)_repeat(5,minmax(72px,1fr))] items-center";

function Cell({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex items-center gap-2 text-[13px]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-sm border transition-colors",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600 peer-focus-visible:ring-offset-2",
          checked ? "border-blue-600 bg-blue-600" : "border-slate-300 bg-white",
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-white" fill="none">
            <path d="M2.5 6.2 5 8.5l4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={checked ? "text-slate-800" : "text-slate-400"}>{checked ? "Yes" : "No"}</span>
    </label>
  );
}

export function PermissionMatrix({ groups, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-8 px-6 py-8 sm:px-10">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`pm-${group.id}`} className="overflow-x-auto">
          <div className="min-w-160">
            {/* column headers */}
            <div className={cn(GRID, "pb-3")}>
              <h3 id={`pm-${group.id}`} className="text-sm font-semibold text-slate-900">
                {group.label}
              </h3>
              {group.columns.map((c) => (
                <span key={c.key} className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {c.label}
                </span>
              ))}
            </div>

            {/* rows */}
            <div className="border-t border-slate-100">
              {group.rows.map((row) => (
                <div key={row.id} className={cn(GRID, "h-11 border-b border-slate-100 last:border-b-0")}>
                  <div className="flex items-center gap-3 text-[13px] font-medium text-slate-800">
                    {row.icon && <span className="text-slate-500">{row.icon}</span>}
                    {row.label}
                  </div>
                  {group.columns.map((c) => {
                    const supported = !row.supports || row.supports.includes(c.key);
                    if (!supported) return <span key={c.key} className="text-slate-300">–</span>;
                    const key = cellKey(row.id, c.key);
                    return (
                      <Cell
                        key={c.key}
                        checked={!!value[key]}
                        disabled={disabled}
                        label={`${row.label}: ${c.label}`}
                        onChange={(next) => onChange(key, next)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

/** Card header from the screenshot: avatar, name, role, and the two actions. */
export function PermissionHeader({
  name,
  subtitle,
  avatar,
  onRestore,
  onViewProfile,
  restoring,
}: {
  name: string;
  subtitle?: string;
  avatar?: ReactNode;
  onRestore: () => void;
  onViewProfile?: () => void;
  restoring?: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
      <div className="flex items-center gap-4">
        {avatar}
        <div>
          <p className="text-[15px] font-semibold text-slate-900">{name}</p>
          {subtitle && <p className="text-[13px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRestore}
          disabled={restoring}
          className="rounded-lg border border-red-200 bg-red-50/60 px-3 py-1.5 text-[13px] font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
        >
          Restore role defaults
        </button>
        {onViewProfile && (
          <button
            type="button"
            onClick={onViewProfile}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-800 hover:bg-slate-50"
          >
            View profile
          </button>
        )}
      </div>
    </header>
  );
}