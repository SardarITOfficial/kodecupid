import type { DocumentType } from './enums';

export const DEFAULT_LEGAL_VERSIONS: Record<DocumentType, string> = {
  TERMS: '1.0',
  COMMUNITY_GUIDELINES: '1.0',
  SAFETY_TIPS: '1.0',
  PRIVACY: '1.0',
};

export interface LegalDocument {
  type: DocumentType;
  title: string;
  version: string;
  updatedAt: string;
  summary: string;
  sections: { heading: string; body: string }[];
}

/**
 * Placeholder legal copy, versioned so replacing it is a configuration change.
 * Counsel-approved text must replace this before public launch.
 */
export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    type: 'TERMS',
    title: 'Terms of Service',
    version: DEFAULT_LEGAL_VERSIONS.TERMS,
    updatedAt: '2026-01-01',
    summary:
      'You must be 18 or older. You agree to treat other members with respect and to keep your account details accurate.',
    sections: [
      {
        heading: 'Eligibility',
        body: 'KodeCupid is for adults aged 18 and over. You must provide your real date of birth and complete the age check before using the service.',
      },
      {
        heading: 'Your account',
        body: 'You are responsible for everything done through your phone number and account. Keep your device secure and tell us immediately if you believe someone else has access.',
      },
      {
        heading: 'Accurate information',
        body: 'Profile details must be truthful. Impersonation, misleading photos, and fake credentials are not allowed and may result in removal.',
      },
      {
        heading: 'Acceptable use',
        body: 'Harassment, hate speech, threats, spam, solicitation, and sharing another member’s private information are prohibited.',
      },
      {
        heading: 'Safety',
        body: 'Profiles are self-reported. Take normal precautions: meet in public, tell a friend, and never send money to someone you met through the app.',
      },
      {
        heading: 'Ending the agreement',
        body: 'You may pause your profile at any time or request deletion of your data. We may suspend accounts that break these terms.',
      },
    ],
  },
  {
    type: 'COMMUNITY_GUIDELINES',
    title: 'Community Guidelines',
    version: DEFAULT_LEGAL_VERSIONS.COMMUNITY_GUIDELINES,
    updatedAt: '2026-01-01',
    summary:
      'Be kind, be honest, and report anything that feels unsafe. These rules apply to every member.',
    sections: [
      {
        heading: 'Be kind',
        body: 'No harassment, discrimination, or pressure. A respectful “no” is always valid.',
      },
      {
        heading: 'Be honest',
        body: 'Use recent photos of yourself and describe your real work and intentions.',
      },
      {
        heading: 'One account per person',
        body: 'Do not create accounts for other people or operate multiple profiles.',
      },
      {
        heading: 'Report problems',
        body: 'Use the report options in the app. Complaints are reviewed by our moderation team.',
      },
    ],
  },
  {
    type: 'SAFETY_TIPS',
    title: 'Safety Tips',
    version: DEFAULT_LEGAL_VERSIONS.SAFETY_TIPS,
    updatedAt: '2026-01-01',
    summary:
      'Dating safely is a shared responsibility. Read these four rules before you meet anyone.',
    sections: [
      {
        heading: 'Protect your privacy',
        body: 'Use the visibility toggles for sensitive details. Keep your exact workplace, home address, and financial information to yourself until you trust someone.',
      },
      {
        heading: 'Meet safely',
        body: 'Meet in a public place, arrange your own transport, and tell someone you trust where you are going.',
      },
      {
        heading: 'Never send money',
        body: 'No legitimate match will ask for money, gift cards, or cryptocurrency. Treat requests like this as fraud and report them.',
      },
      {
        heading: 'Take your time',
        body: 'You are never obligated to meet, share photos, or continue a conversation. Blocking and reporting are always available.',
      },
    ],
  },
  {
    type: 'PRIVACY',
    title: 'Privacy Policy',
    version: DEFAULT_LEGAL_VERSIONS.PRIVACY,
    updatedAt: '2026-01-01',
    summary:
      'We collect the minimum needed to run the service. Each profile field has its own visibility setting.',
    sections: [
      {
        heading: 'What we collect',
        body: 'Your phone number, date of birth, the profile details you choose to add, and technical logs required to keep the service secure.',
      },
      {
        heading: 'What other members see',
        body: 'Only the fields you have not hidden. Your phone number, date of birth, and exact coordinates are never shown to other members.',
      },
      {
        heading: 'Your controls',
        body: 'You can hide individual fields, pause your profile, or request deletion at any time.',
      },
      {
        heading: 'Staff access',
        body: 'Moderators can only see what they need to handle a complaint or verification request. Access is logged.',
      },
    ],
  },
];

export function legalDocument(type: DocumentType): LegalDocument {
  const doc = LEGAL_DOCUMENTS.find((item) => item.type === type);
  if (!doc) {
    throw new Error(`Unknown legal document: ${type}`);
  }
  return doc;
}
