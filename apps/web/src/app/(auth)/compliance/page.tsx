'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComplianceDocumentView, MemberSession } from '@kodecupid/shared';
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

export default function CompliancePage() {
  const router = useRouter();
  const { setMember, logout } = useSession();

  const [documents, setDocuments] = useState<ComplianceDocumentView[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [confirmAdult, setConfirmAdult] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptGuidelines, setAcceptGuidelines] = useState(false);
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

  const termsVersion = useMemo(
    () => documents.find((document) => document.type === 'TERMS')?.version ?? '',
    [documents],
  );
  const guidelinesVersion = useMemo(
    () => documents.find((document) => document.type === 'COMMUNITY_GUIDELINES')?.version ?? '',
    [documents],
  );
  const privacy = documents.find((document) => document.type === 'PRIVACY');

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    if (!dateOfBirth) {
      setFieldError('Enter your date of birth');
      return;
    }
    if (!confirmAdult || !acceptTerms || !acceptGuidelines) {
      setError('Please confirm all three statements to continue.');
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
          termsVersion,
          guidelinesVersion,
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
      <div className="pt-2">
        <div className="rounded-card border border-crimson/25 bg-white p-6">
          <span aria-hidden className="text-3xl">
            🔞
          </span>
          <h1 className="mt-3 text-xl font-semibold text-navy">KodeCupid is for adults only</h1>
          <p className="mt-2 text-sm leading-relaxed text-charcoal">
            You must be at least 18 years old to create an account. We are not able to keep your
            registration, and nothing you entered has been published.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => void logout()}>
              Sign out
            </Button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-line px-5 text-sm font-semibold text-navy"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loadingDocs) {
    return <LoadingBlock label="Loading the terms" rows={3} />;
  }

  return (
    <div className="pt-2">
      <h1 className="text-2xl font-semibold tracking-tight text-navy">Before we start</h1>
      <p className="mt-2 text-sm text-muted">
        Two quick legal steps. We only ask once, and we store the date and the version you agreed to.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="rounded-card border border-line bg-white p-5">
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

        {documents
          .filter((document) => document.type !== 'PRIVACY')
          .map((document) => (
            <div key={document.type} className="rounded-card border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-navy">{document.title}</h2>
                <span className="text-xs text-muted">v{document.version}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{document.summary}</p>

              <details className="mt-3 rounded-xl bg-alabaster p-3">
                <summary className="cursor-pointer text-xs font-semibold text-navy">
                  Read the full text
                </summary>
                <div className="mt-2 space-y-2">
                  {document.sections.map((section) => (
                    <div key={section.heading}>
                      <p className="text-xs font-semibold text-charcoal">{section.heading}</p>
                      <p className="text-xs leading-relaxed text-muted">{section.body}</p>
                    </div>
                  ))}
                </div>
              </details>

              <div className="mt-3">
                {document.type === 'TERMS' ? (
                  <CheckboxRow id="accept-terms" checked={acceptTerms} onChange={setAcceptTerms}>
                    I accept the <strong>Terms of Service</strong>.
                  </CheckboxRow>
                ) : (
                  <CheckboxRow
                    id="accept-guidelines"
                    checked={acceptGuidelines}
                    onChange={setAcceptGuidelines}
                  >
                    I accept the <strong>Community Guidelines &amp; Safety Tips</strong>.
                  </CheckboxRow>
                )}
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
    </div>
  );
}
