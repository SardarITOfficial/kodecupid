export function ProgressSteps({
  steps,
  currentIndex,
}: {
  steps: { key: string; label: string }[];
  currentIndex: number;
}) {
  const current = Math.min(Math.max(currentIndex, 0), steps.length - 1);
  const percent = Math.round(((current + 1) / steps.length) * 100);

  return (
    <div>
      {/* Mobile: bar */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-crimson">
            Step {current + 1} of {steps.length}
          </p>
          <p className="text-xs font-medium text-navy">{steps[current]?.label}</p>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Onboarding progress"
        >
          <div
            className="h-full rounded-full bg-crimson transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Desktop: numbered steps */}
      <ol className="hidden items-start sm:flex" aria-label="Onboarding progress">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={step.key}
              className="relative flex flex-1 flex-col items-center text-center"
              aria-current={active ? 'step' : undefined}
            >
              {index > 0 ? (
                <span
                  aria-hidden
                  className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                    index <= current ? 'bg-crimson' : 'bg-line'
                  }`}
                />
              ) : null}
              <span
                className={`relative z-10 grid size-8 place-items-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-crimson text-white'
                    : active
                      ? 'bg-navy text-white ring-4 ring-navy/10'
                      : 'border border-line bg-white text-muted'
                }`}
              >
                {done ? '✓' : index + 1}
              </span>
              <span
                className={`mt-2 text-xs ${
                  active ? 'font-semibold text-navy' : done ? 'text-charcoal' : 'text-muted'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}