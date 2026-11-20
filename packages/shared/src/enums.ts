/**
 * Domain vocabulary shared by the API, the web app and the database.
 *
 * Every enum is a `const` array plus a union type, so the same values can feed
 * `z.enum(...)`, Prisma, and UI option lists without drifting.
 */

/* ───────────────────────────── Identity ───────────────────────────── */

export const GENDER_IDENTITY_VALUES = [
  'WOMAN',
  'MAN',
  'NON_BINARY',
  'OTHER',
  'PREFER_NOT_TO_SAY',
] as const;
export type GenderIdentity = (typeof GENDER_IDENTITY_VALUES)[number];
export const GENDER_IDENTITY_LABELS: Record<GenderIdentity, string> = {
  WOMAN: 'Woman',
  MAN: 'Man',
  NON_BINARY: 'Non-binary',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

export const INTERESTED_IN_VALUES = ['WOMEN', 'MEN', 'NON_BINARY_PEOPLE', 'EVERYONE'] as const;
export type InterestedIn = (typeof INTERESTED_IN_VALUES)[number];
export const INTERESTED_IN_LABELS: Record<InterestedIn, string> = {
  WOMEN: 'Women',
  MEN: 'Men',
  NON_BINARY_PEOPLE: 'Non-binary people',
  EVERYONE: 'Everyone',
};

/* ─────────────────────────── Work & lifestyle ─────────────────────── */

export const SHIFT_SCHEDULE_VALUES = [
  'DAY',
  'NIGHT',
  'ROTATING',
  'FLEXIBLE',
  'ON_CALL',
  'OTHER',
] as const;
export type ShiftSchedule = (typeof SHIFT_SCHEDULE_VALUES)[number];
export const SHIFT_SCHEDULE_LABELS: Record<ShiftSchedule, string> = {
  DAY: 'Day shift',
  NIGHT: 'Night shift',
  ROTATING: 'Rotating shifts',
  FLEXIBLE: 'Flexible hours',
  ON_CALL: 'On call',
  OTHER: 'Other',
};

/** Profession groups required for launch. */
export const PROFESSION_CATEGORY_VALUES = [
  'HEALTHCARE',
  'EDUCATION',
  'EMS',
  'LAW_ENFORCEMENT',
  'FIREFIGHTER',
  'MILITARY_VETERAN',
  'ENGINEER',
  'TECHNICIAN',
  'OTHER',
] as const;
export type ProfessionCategory = (typeof PROFESSION_CATEGORY_VALUES)[number];
export const PROFESSION_CATEGORY_LABELS: Record<ProfessionCategory, string> = {
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education',
  EMS: 'EMS',
  LAW_ENFORCEMENT: 'Law enforcement',
  FIREFIGHTER: 'Firefighters',
  MILITARY_VETERAN: 'Military & veterans',
  ENGINEER: 'Engineers',
  TECHNICIAN: 'Technicians',
  OTHER: 'Other',
};

export const LIFESTYLE_VALUES = ['NEVER', 'RARELY', 'SOCIALLY', 'OFTEN', 'DAILY'] as const;
export type Lifestyle = (typeof LIFESTYLE_VALUES)[number];
export const LIFESTYLE_LABELS: Record<Lifestyle, string> = {
  NEVER: 'Never',
  RARELY: 'Rarely',
  SOCIALLY: 'Socially',
  OFTEN: 'Often',
  DAILY: 'Daily',
};

export const EXERCISE_VALUES = ['NEVER', 'SOMETIMES', 'REGULARLY', 'DAILY'] as const;
export type Exercise = (typeof EXERCISE_VALUES)[number];
export const EXERCISE_LABELS: Record<Exercise, string> = {
  NEVER: 'Never',
  SOMETIMES: 'Sometimes',
  REGULARLY: 'Regularly',
  DAILY: 'Daily',
};

/* ──────────────────────────── Education ───────────────────────────── */

export const EDUCATION_LEVEL_VALUES = [
  'HIGH_SCHOOL',
  'ASSOCIATE',
  'BACHELORS',
  'MASTERS',
  'DOCTORATE',
  'PROFESSIONAL',
  'OTHER',
] as const;
export type EducationLevel = (typeof EDUCATION_LEVEL_VALUES)[number];
export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  HIGH_SCHOOL: 'High school',
  ASSOCIATE: 'Associate degree',
  BACHELORS: "Bachelor's degree",
  MASTERS: "Master's degree",
  DOCTORATE: 'Doctorate',
  PROFESSIONAL: 'Professional degree',
  OTHER: 'Other',
};

export const CREDENTIAL_VALUES = [
  'MD',
  'DO',
  'RN',
  'NP',
  'PA',
  'PHD',
  'JD',
  'DDS',
  'PHARMD',
  'EMT',
  'LPN',
  'CNA',
  'OTHER',
] as const;
export type Credential = (typeof CREDENTIAL_VALUES)[number];
export const CREDENTIAL_LABELS: Record<Credential, string> = {
  MD: 'MD',
  DO: 'DO',
  RN: 'RN',
  NP: 'NP',
  PA: 'PA',
  PHD: 'PhD',
  JD: 'JD',
  DDS: 'DDS',
  PHARMD: 'PharmD',
  EMT: 'EMT',
  LPN: 'LPN',
  CNA: 'CNA',
  OTHER: 'Other',
};

/* ────────────────────────── Intent & family ───────────────────────── */

export const RELATIONSHIP_GOAL_VALUES = [
  'LONG_TERM',
  'LIFE_PARTNER',
  'CASUAL',
  'FRIENDSHIP',
  'OPEN_TO_ANYTHING',
] as const;
export type RelationshipGoal = (typeof RELATIONSHIP_GOAL_VALUES)[number];
export const RELATIONSHIP_GOAL_LABELS: Record<RelationshipGoal, string> = {
  LONG_TERM: 'Long-term relationship',
  LIFE_PARTNER: 'Life partner',
  CASUAL: 'Casual dating',
  FRIENDSHIP: 'Friendship first',
  OPEN_TO_ANYTHING: 'Open to anything',
};

export const FAMILY_PLANS_VALUES = [
  'WANT_CHILDREN',
  'OPEN_TO_CHILDREN',
  'DONT_WANT_CHILDREN',
  'HAVE_CHILDREN_WANT_MORE',
  'HAVE_CHILDREN_NO_MORE',
  'UNDECIDED',
] as const;
export type FamilyPlans = (typeof FAMILY_PLANS_VALUES)[number];
export const FAMILY_PLANS_LABELS: Record<FamilyPlans, string> = {
  WANT_CHILDREN: 'Want children',
  OPEN_TO_CHILDREN: 'Open to children',
  DONT_WANT_CHILDREN: "Don't want children",
  HAVE_CHILDREN_WANT_MORE: 'Have children, want more',
  HAVE_CHILDREN_NO_MORE: 'Have children, no more',
  UNDECIDED: 'Undecided',
};

export const KIDS_VALUES = ['NO_KIDS', 'HAVE_KIDS', 'PREFER_NOT_TO_SAY'] as const;
export type Kids = (typeof KIDS_VALUES)[number];
export const KIDS_LABELS: Record<Kids, string> = {
  NO_KIDS: 'No kids',
  HAVE_KIDS: 'Have kids',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

/* ───────────────────────────── Profile ────────────────────────────── */

export const PROFILE_STATUS_VALUES = ['ACTIVE', 'PAUSED'] as const;
export type ProfileStatus = (typeof PROFILE_STATUS_VALUES)[number];

export const VISIBILITY_VALUES = ['PUBLIC', 'HIDDEN', 'MATCHED'] as const;
export type VisibilityLevel = (typeof VISIBILITY_VALUES)[number];
export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  PUBLIC: 'Visible to members',
  HIDDEN: 'Hidden',
  MATCHED: 'Visible to matches only',
};

/**
 * Every profile attribute that can be switched on/off individually.
 * `MATCHED` is reserved for the audience-scoped privacy work in Milestone 3.
 */
export const PROFILE_FIELD_VALUES = [
  'DISPLAY_NAME',
  'AGE',
  'GENDER_IDENTITY',
  'INTERESTED_IN',
  'LOCATION',
  'PROFESSION',
  'SHIFT_SCHEDULE',
  'WORKPLACE',
  'RELIGION',
  'ETHNICITY',
  'LANGUAGES',
  'HEIGHT',
  'LIFESTYLE',
  'EDUCATION',
  'CREDENTIALS',
  'RELATIONSHIP_GOALS',
  'FAMILY_PLANS',
  'KIDS',
  'BIO',
  'PHOTOS',
] as const;
export type ProfileField = (typeof PROFILE_FIELD_VALUES)[number];
export const PROFILE_FIELD_LABELS: Record<ProfileField, string> = {
  DISPLAY_NAME: 'Display name',
  AGE: 'Age',
  GENDER_IDENTITY: 'Gender identity',
  INTERESTED_IN: 'Interested in',
  LOCATION: 'Location',
  PROFESSION: 'Profession',
  SHIFT_SCHEDULE: 'Shift schedule',
  WORKPLACE: 'Workplace',
  RELIGION: 'Religion',
  ETHNICITY: 'Ethnicity',
  LANGUAGES: 'Languages',
  HEIGHT: 'Height',
  LIFESTYLE: 'Lifestyle',
  EDUCATION: 'Education',
  CREDENTIALS: 'Credentials',
  RELATIONSHIP_GOALS: 'Relationship goals',
  FAMILY_PLANS: 'Family plans',
  KIDS: 'Kids',
  BIO: 'Bio',
  PHOTOS: 'Photos',
};

/* ────────────────────────── Legal & accounts ──────────────────────── */

export const DOCUMENT_TYPE_VALUES = [
  'TERMS',
  'COMMUNITY_GUIDELINES',
  'SAFETY_TIPS',
  'PRIVACY',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPE_VALUES)[number];
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  TERMS: 'Terms of Service',
  COMMUNITY_GUIDELINES: 'Community Guidelines',
  SAFETY_TIPS: 'Safety Tips',
  PRIVACY: 'Privacy Policy',
};

/* ──────────────────────────── Regions ─────────────────────────────── */

export const REGION_LAUNCH_STATUS_VALUES = [
  'PLANNED',
  'PRE_LAUNCH',
  'LAUNCHED',
  'PAUSED',
] as const;
export type RegionLaunchStatus = (typeof REGION_LAUNCH_STATUS_VALUES)[number];
export const REGION_LAUNCH_STATUS_LABELS: Record<RegionLaunchStatus, string> = {
  PLANNED: 'Planned',
  PRE_LAUNCH: 'Pre-launch',
  LAUNCHED: 'Launched',
  PAUSED: 'Paused',
};

export const USER_STATUS_VALUES = [
  'PENDING_COMPLIANCE',
  'ACTIVE',
  'SUSPENDED',
  'DELETION_REQUESTED',
  'DELETED',
] as const;
export type UserStatus = (typeof USER_STATUS_VALUES)[number];
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  PENDING_COMPLIANCE: 'Awaiting age & terms',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  DELETION_REQUESTED: 'Deletion requested',
  DELETED: 'Deleted',
};

export const OTP_PURPOSE_VALUES = ['REGISTER', 'LOGIN'] as const;
export type OtpPurpose = (typeof OTP_PURPOSE_VALUES)[number];

export const ADMIN_ROLE_VALUES = ['SUPER_ADMIN', 'MODERATOR'] as const;
export type AdminRole = (typeof ADMIN_ROLE_VALUES)[number];
export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  MODERATOR: 'Moderator',
};

export const ADMIN_STATUS_VALUES = ['ACTIVE', 'DISABLED'] as const;
export type AdminStatus = (typeof ADMIN_STATUS_VALUES)[number];

/* ────────────────────────── Onboarding steps ──────────────────────── */

export const ONBOARDING_STEP_VALUES = [
  'welcome',
  'identity',
  'profession',
  'location',
  'preferences',
  'privacy',
  'complete',
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEP_VALUES)[number];
export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Welcome',
  identity: 'About you',
  profession: 'Work & shifts',
  location: 'Location',
  preferences: 'What you want',
  privacy: 'Privacy',
  complete: 'All set',
};
