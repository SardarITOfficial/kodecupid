'use client';

import { useRef } from 'react';

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function focusAt(index: number): void {
    refs.current[Math.min(Math.max(index, 0), length - 1)]?.focus();
  }

  function handleChange(index: number, raw: string): void {
    const clean = raw.replace(/\D/g, '');
    if (!clean) return;
    if (clean.length > 1) {
      // Autofill or multi-character input
      onChange((value.slice(0, index) + clean).slice(0, length));
      focusAt(index + clean.length);
      return;
    }
    onChange((value.slice(0, index) + clean + value.slice(index + 1)).slice(0, length));
    focusAt(index + 1);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusAt(index - 1);
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
    event.preventDefault();
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    onChange(text);
    focusAt(text.length);
  }

  return (
    <div role="group" aria-label="Verification code" className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          autoFocus={index === 0}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => {
            // Keep input contiguous: jump to the first empty box
            if (index > value.length) focusAt(value.length);
            else event.target.select();
          }}
          className={`h-14 w-11 rounded-xl border bg-white text-center text-2xl font-semibold text-navy shadow-sm transition-colors focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/20 disabled:bg-alabaster sm:h-16 sm:w-14 ${
            invalid ? 'border-crimson' : digit ? 'border-navy/40' : 'border-line'
          }`}
        />
      ))}
    </div>
  );
}