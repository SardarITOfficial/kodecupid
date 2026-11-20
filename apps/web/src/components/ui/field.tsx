'use client';

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const baseField =
  'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-muted/70 transition-colors focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/20 disabled:bg-alabaster disabled:text-muted';

function borderFor(error?: string): string {
  return error ? 'border-crimson' : 'border-line';
}

export function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center justify-between text-sm font-medium text-navy">
      <span>{children}</span>
      {optional ? <span className="text-xs font-normal text-muted">Optional</span> : null}
    </label>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-crimson">
      {children}
    </p>
  );
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  prefix?: string;
}

export function TextInput({
  label,
  hint,
  error,
  optional,
  prefix,
  id,
  className = '',
  ...rest
}: TextInputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const describedBy = [hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      {label ? (
        <FieldLabel htmlFor={fieldId} optional={optional}>
          {label}
        </FieldLabel>
      ) : null}
      <div className={prefix ? 'flex items-stretch' : undefined}>
        {prefix ? (
          <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-alabaster px-3 text-sm text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(baseField, borderFor(error), prefix && 'rounded-l-none', className)}
          {...rest}
        />
      </div>
      {hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}

export function TextArea({ label, hint, error, optional, id, className = '', ...rest }: TextAreaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div>
      {label ? (
        <FieldLabel htmlFor={fieldId} optional={optional}>
          {label}
        </FieldLabel>
      ) : null}
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
        className={cn(baseField, borderFor(error), 'min-h-28 resize-y', className)}
        {...rest}
      />
      {hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
    </div>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  options,
  placeholder,
  id,
  className = '',
  ...rest
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div>
      {label ? (
        <FieldLabel htmlFor={fieldId} optional={optional}>
          {label}
        </FieldLabel>
      ) : null}
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={cn(baseField, borderFor(error), 'appearance-none bg-white pr-9', className)}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      <FieldError id={`${fieldId}-error`}>{error}</FieldError>
    </div>
  );
}

export function CheckboxRow({
  id,
  checked,
  onChange,
  children,
  required,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-3.5 transition-colors hover:border-navy/20"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 rounded border-line text-crimson accent-crimson focus:ring-crimson"
      />
      <span className="text-sm leading-relaxed text-charcoal">{children}</span>
    </label>
  );
}
