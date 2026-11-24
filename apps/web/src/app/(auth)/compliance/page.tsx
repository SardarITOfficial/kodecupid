'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComplianceDocumentView, DocumentType, MemberSession } from '@kodecupid/shared';
import { useSession } from '@/app/providers';
import { apiFetch, ApiError, errorMessage } from '@/lib/api';
import { routeAfterAuth } from '@/lib/routing';
import { Button } from '@/components/ui/button';
import { CheckboxRow, TextInput } from '@/components/ui/field';
import { Alert, LoadingBlock } from '@/components/ui/feedback';

function eighteenYearsAgo(): string {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

/** The three documents that must be accepted before onboarding. */
const REQUIRED_DOCUMENTS: DocumentType[] = ['TERMS', 'COMMUNITY_GUIDELINES', 'SAFETY_TIPS'];

function PageWrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">{children}</div>;
}

export default function CompliancePage() {
  const router = useRouter();
  const { setMember, logout } = useSession();

  const [documents, setDocuments] = useState<ComplianceDocumentView[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [confirmAdult, setConfirmAdult] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ documents: ComplianceDocumentView[] }>('/compliance/documents')
      .then((result) => {
        if (!cancelled) setDocuments(result.documents);
      })
      .catch((caught) => {
        if (!cancelled) setError(errorMessage(caught, 'Could not load the legal documents.'));
      })
      .finally(() => {
        if (!cancelled) setLoadingDocs(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const versionOf = useMemo(
    () => (type: DocumentType) => documents.find((document) => document.type === type)?.version ?? '',
    [documents],
  );

  const privacy = documents.find((document) => document.type === 'PRIVACY');
  const requiredDocuments = documents.filter((document) =>
    REQUIRED_DOCUMENTS.includes(document.type),
  );
  const allAccepted = REQUIRED_DOCUMENTS.every((type) => accepted[type]);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    if (!dateOfBirth) {
      setFieldError('Enter your date of birth');
      return;
    }
    if (!confirmAdult || !allAccepted) {
      setError('Please confirm all four statements to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await apiFetch<MemberSession>('/compliance/accept', {
        method: 'POST',
        body: {
          dateOfBirth,
          confirmAdult: true,
          acceptTerms: true,
          acceptGuidelines: true,
          acceptSafetyTips: true,
          termsVersion: versionOf('TERMS'),
          guidelinesVersion: versionOf('COMMUNITY_GUIDELINES'),
          safetyTipsVersion: versionOf('SAFETY_TIPS'),
        },
      });
      setMember(session);
      routeAfterAuth(session, router);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'AGE_RESTRICTED') {
        setBlocked(true);
        return;
      }
      if (caught instanceof ApiError && caught.fieldErrors.dateOfBirth) {
        setFieldError(caught.fieldErrors.dateOfBirth);
        return;
      }
      setError(errorMessage(caught, 'We could not record your confirmation.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (blocked) {
    return (
      <PageWrap>
        <div className="mx-auto max-w-md rounded-card border border-crimson/25 bg-white p-6 text-center shadow-sm sm:p-8">
          <span aria-hidden className="text-4xl">
            🔞
          </span>
          <h1 className="mt-4 text-xl font-semibold text-navy">KodeCupid is for adults only</h1>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">
            You must be at least 18 years old to create an account. We are not able to keep your
            registration, and nothing you entered has been published.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" onClick={() => void logout()}>
              Sign out
            </Button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-semibold text-navy transition-colors hover:bg-alabaster"
            >
              Back to home
            </Link>
          </div>
        </div>
      </PageWrap>
    );
  }

  if (loadingDocs) {
    return (
      <PageWrap>
        <LoadingBlock label="Loading the terms" rows={3} />
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson">
        Step 1 of 2
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Before we start
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
        Confirm your age and accept the three documents below. We only ask once, and we store the
        date and version of each acceptance.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="rounded-card border border-line bg-white p-5 shadow-sm sm:p-6">
          <TextInput
            label="Date of birth"
            type="date"
            required
            max={eighteenYearsAgo()}
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            error={fieldError ?? undefined}
            hint="Used only to confirm you are 18+ and to show your age. Never shown publicly."
          />

          <div className="mt-4">
            <CheckboxRow id="confirm-adult" checked={confirmAdult} onChange={setConfirmAdult}>
              I confirm that I am <strong>18 years or older</strong>.
            </CheckboxRow>
          </div>
        </div>

        {requiredDocuments.map((document) => (
          <div
            key={document.type}
            className="rounded-card border border-line bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-navy">{document.title}</h2>
              <span className="rounded-full bg-alabaster px-2.5 py-0.5 text-xs text-muted">
                v{document.version}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{document.summary}</p>

            <details className="mt-4 rounded-xl bg-alabaster p-3.5">
              <summary className="cursor-pointer text-xs font-semibold text-navy">
                Read the full text
              </summary>
              <div className="mt-3 space-y-3">
                {document.sections.map((section) => (
                  <div key={section.heading}>
                    <p className="text-xs font-semibold text-charcoal">{section.heading}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{section.body}</p>
                  </div>
                ))}
              </div>
            </details>

            <div className="mt-4">
              <CheckboxRow
                id={`accept-${document.type}`}
                checked={accepted[document.type] ?? false}
                onChange={(checked) =>
                  setAccepted((current) => ({ ...current, [document.type]: checked }))
                }
              >
                I accept the <strong>{document.title}</strong>.
              </CheckboxRow>
            </div>
          </div>
        ))}

        {privacy ? (
          <Alert tone="info" title={`${privacy.title} (v${privacy.version})`}>
            {privacy.summary}
          </Alert>
        ) : null}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Continue to setup
        </Button>
      </form>
    </PageWrap>
  );
}