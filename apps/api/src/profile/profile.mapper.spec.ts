import type { ProfileWithRelations } from './profile.mapper';
import { completionPercent, toOwnerView, toPublicView, visibilityMap } from './profile.mapper';

const photoUrl = (key: string) => `https://cdn.test/${key}`;

function makeProfile(overrides: Partial<ProfileWithRelations> = {}): ProfileWithRelations {
  const base = {
    id: 'profile_1',
    userId: 'user_1',
    displayName: 'Ayesha R.',
    dateOfBirth: new Date('1997-03-14T00:00:00.000Z'),
    genderIdentity: 'WOMAN',
    genderIdentityOther: null,
    interestedIn: ['MEN'],
    profession: 'Registered Nurse',
    employerName: 'Dhaka Medical College Hospital',
    shiftSchedule: 'NIGHT',
    shiftNotes: null,
    city: 'Dhaka',
    region: 'Dhaka Division',
    country: 'BD',
    latitude: 23.8103,
    longitude: 90.4125,
    religion: 'Islam',
    ethnicity: 'Bengali',
    languages: ['Bengali', 'English'],
    heightCm: 163,
    drinking: 'NEVER',
    smoking: 'NEVER',
    cannabis: null,
    exercise: 'SOMETIMES',
    educationLevel: 'BACHELORS',
    credentials: ['RN'],
    relationshipGoals: ['LONG_TERM'],
    familyPlans: 'OPEN_TO_CHILDREN',
    kids: 'NO_KIDS',
    bio: 'Night-shift nurse.',
    workplaceName: 'Dhaka Medical College Hospital',
    workplaceLatitude: 23.72,
    workplaceLongitude: 90.39,
    workplaceRadiusM: 300,
    status: 'ACTIVE',
    pausedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    visibility: [],
    photos: [],
  };

  return { ...base, ...overrides } as unknown as ProfileWithRelations;
}

describe('toPublicView — field-level privacy', () => {
  it('hides sensitive fields by default and reports them in hiddenFields', () => {
    const view = toPublicView(makeProfile(), photoUrl);

    expect(view.religion).toBeUndefined();
    expect(view.ethnicity).toBeUndefined();
    expect(view.workplaceName).toBeUndefined();
    expect(view.hiddenFields).toEqual(
      expect.arrayContaining(['RELIGION', 'ETHNICITY', 'WORKPLACE']),
    );
  });

  it('exposes a field once the owner marks it public', () => {
    const view = toPublicView(
      makeProfile({
        visibility: [
          { id: 'v1', profileId: 'profile_1', field: 'RELIGION', visibility: 'PUBLIC', updatedAt: new Date() },
        ] as ProfileWithRelations['visibility'],
      }),
      photoUrl,
    );

    expect(view.religion).toBe('Islam');
    expect(view.hiddenFields).not.toContain('RELIGION');
  });

  it('never leaks exact coordinates or private bookkeeping fields', () => {
    const view = toPublicView(makeProfile(), photoUrl) as unknown as Record<string, unknown>;

    expect(view.latitude).toBeUndefined();
    expect(view.longitude).toBeUndefined();
    expect(view.workplaceLatitude).toBeUndefined();
    expect(view.workplaceLongitude).toBeUndefined();
    expect(view.dateOfBirth).toBeUndefined();
    expect(view.status).toBeUndefined();
  });

  it('computes age from the date of birth', () => {
    const view = toPublicView(makeProfile(), photoUrl);
    const expected = new Date().getUTCFullYear() - 1997 - (new Date().getUTCMonth() < 2 ? 1 : 0);
    expect(view.age).toBeGreaterThanOrEqual(expected - 1);
    expect(view.age).toBeLessThanOrEqual(expected + 1);
  });

  it('omits photos entirely when the photo field is hidden', () => {
    const profile = makeProfile({
      photos: [
        {
          id: 'photo_1',
          profileId: 'profile_1',
          storageKey: 'p1.webp',
          mimeType: 'image/webp',
          sizeBytes: 1000,
          width: 800,
          height: 1000,
          sortOrder: 0,
          isPrimary: true,
          moderationStatus: 'APPROVED',
          createdAt: new Date(),
        },
      ],
      visibility: [
        { id: 'v1', profileId: 'profile_1', field: 'PHOTOS', visibility: 'HIDDEN', updatedAt: new Date() },
      ] as ProfileWithRelations['visibility'],
    });

    const view = toPublicView(profile, photoUrl);
    expect(view.photos).toBeUndefined();
    expect(view.hiddenFields).toContain('PHOTOS');
  });

  it('marks a paused profile', () => {
    const view = toPublicView(makeProfile({ status: 'PAUSED', pausedAt: new Date() }), photoUrl);
    expect(view.paused).toBe(true);
  });
});

describe('toOwnerView', () => {
  it('returns everything plus the visibility map and completion score', () => {
    const view = toOwnerView(makeProfile(), photoUrl);

    expect(view.religion).toBe('Islam');
    expect(view.dateOfBirth).toBe('1997-03-14');
    expect(view.latitude).toBe(23.8103);
    expect(view.visibility.RELIGION).toBe('HIDDEN');
    expect(view.visibility.AGE).toBe('PUBLIC');
    expect(view.hiddenFields).toEqual([]);
    expect(view.completionPercent).toBeGreaterThan(50);
  });

  it('maps every stored override onto the resolved map', () => {
    const profile = makeProfile({
      visibility: [
        { id: 'v1', profileId: 'profile_1', field: 'RELIGION', visibility: 'PUBLIC', updatedAt: new Date() },
      ] as ProfileWithRelations['visibility'],
    });

    expect(visibilityMap(profile).RELIGION).toBe('PUBLIC');
    expect(visibilityMap(profile).WORKPLACE).toBe('HIDDEN');
  });
});

describe('completionPercent', () => {
  it('is 0 for an empty profile and 100 for a fully filled one', () => {
    const empty = makeProfile({
      displayName: null,
      dateOfBirth: null,
      genderIdentity: null,
      interestedIn: [],
      profession: null,
      shiftSchedule: null,
      city: null,
      relationshipGoals: [],
      bio: null,
    });

    expect(completionPercent(empty, 0)).toBe(0);
    expect(completionPercent(makeProfile(), 2)).toBe(100);
  });
});
