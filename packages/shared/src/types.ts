import type {
  AdminRole,
  Credential,
  DocumentType,
  EducationLevel,
  Exercise,
  FamilyPlans,
  GenderIdentity,
  InterestedIn,
  Kids,
  Lifestyle,
  OnboardingStep,
  ProfileField,
  ProfileStatus,
  RelationshipGoal,
  ShiftSchedule,
  UserStatus,
  VisibilityLevel,
} from './enums';
import type { Permission } from './permissions';

/** Stable API error envelope: `{ error: { code, message, details? } }`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LegalVersions {
  terms: string;
  guidelines: string;
  privacy: string;
}

export interface MetaInfo {
  appName: string;
  environment: string;
  minAge: number;
  debugOtpEnabled: boolean;
  smsProvider: 'console' | 'twilio' | string;
  legalVersions: LegalVersions;
}

export interface ComplianceDocumentView {
  type: DocumentType;
  title: string;
  version: string;
  updatedAt: string;
  summary: string;
  sections: { heading: string; body: string }[];
}

export interface ComplianceStatus {
  /** True when the member has not finished the age gate + legal acceptance. */
  required: boolean;
  ageVerified: boolean;
  missing: DocumentType[];
}

export interface OnboardingStatus {
  completed: boolean;
  nextStep: OnboardingStep;
  completedSteps: OnboardingStep[];
}

export interface MemberSummary {
  id: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
  ageVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
  displayName: string | null;
  profileStatus: ProfileStatus | null;
}

export interface MemberSession {
  user: MemberSummary;
  compliance: ComplianceStatus;
  onboarding: OnboardingStatus;
}

export interface ProfilePhotoView {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

/** What another member is allowed to see. Hidden fields are omitted, not nulled. */
export interface ProfileView {
  id: string;
  paused: boolean;
  displayName?: string;
  age?: number;
  genderIdentity?: GenderIdentity;
  genderIdentityOther?: string;
  interestedIn?: InterestedIn[];
  city?: string;
  region?: string;
  country?: string;
  profession?: string;
  employerName?: string;
  shiftSchedule?: ShiftSchedule;
  shiftNotes?: string;
  religion?: string;
  ethnicity?: string;
  languages?: string[];
  heightCm?: number;
  drinking?: Lifestyle;
  smoking?: Lifestyle;
  cannabis?: Lifestyle;
  exercise?: Exercise;
  educationLevel?: EducationLevel;
  credentials?: Credential[];
  relationshipGoals?: RelationshipGoal[];
  familyPlans?: FamilyPlans;
  kids?: Kids;
  bio?: string;
  workplaceName?: string;
  photos?: ProfilePhotoView[];
  hiddenFields: ProfileField[];
}

/** Owner view — includes private bookkeeping fields and the visibility map. */
export interface ProfileOwnerView extends ProfileView {
  dateOfBirth: string | null;
  latitude: number | null;
  longitude: number | null;
  workplaceLatitude: number | null;
  workplaceLongitude: number | null;
  workplaceRadiusM: number | null;
  status: ProfileStatus;
  visibility: Record<ProfileField, VisibilityLevel>;
  completionPercent: number;
  updatedAt: string;
}

export interface OtpRequestResult {
  challengeId: string;
  phone: string;
  expiresAt: string;
  resendAvailableAt: string;
  /** Present only when the API runs with the development fallback enabled. */
  debugCode?: string;
}

export interface AdminSummary {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: 'ACTIVE' | 'DISABLED';
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminSession {
  admin: AdminSummary;
  permissions: Permission[];
}

export interface AdminMemberRow {
  id: string;
  phone: string;
  phoneMasked: string;
  status: UserStatus;
  age: number | null;
  displayName: string | null;
  city: string | null;
  profileStatus: ProfileStatus | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
}

export interface AdminMemberDetail {
  id: string;
  phone: string;
  phoneMasked: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  ageVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
  profile: ProfileOwnerView | null;
  legalAcceptances: {
    documentType: DocumentType;
    documentVersion: string;
    acceptedAt: string;
  }[];
}

export interface AdminInvitationRow {
  id: string;
  email: string;
  role: AdminRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  createdAt: string;
  invitedBy: string | null;
}
