export function ProgressSteps({
  steps,
  currentIndex,
}: {
  steps: { key: string; label: string }[];
  currentIndex: number;
}) {
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-crimson">
          Step {Math.min(currentIndex + 1, steps.length)} of {steps.length}
        </p>
        <p className="text-xs text-muted">{percent}% complete</p>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Onboarding progress"
      >
        <div className="h-full rounded-full bg-crimson transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
      <ol className="mt-3 hidden flex-wrap gap-2 sm:flex">
        {steps.map((step, index) => (
          <li
            key={step.key}
            className={[
              'rounded-full px-2.5 py-1 text-xs',
              index === currentIndex
                ? 'bg-navy text-white'
                : index < currentIndex
                  ? 'bg-crimson-soft text-crimson'
                  : 'bg-white text-muted border border-line',
            ].join(' ')}
          >
            {step.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
