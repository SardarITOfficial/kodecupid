import { Injectable } from '@nestjs/common';
import {
  isAdult,
  type ProfileField,
  type ProfileOwnerView,
  type ProfileUpdateInput,
  type ProfileView,
  type VisibilityLevel,
} from '@kodecupid/shared';
import type { Prisma } from '../prisma/generated';
import { ErrorCode, errors } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { toOwnerView, toPublicView, type ProfileWithRelations } from './profile.mapper';
import { PhotosService } from './photos.service';

const PROFILE_INCLUDE = {
  visibility: true,
  photos: { orderBy: { sortOrder: 'asc' as const } },
};

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly photos: PhotosService,
  ) {}

  private photoUrl = (key: string): string => this.storage.publicUrl(key);

  async ensureProfile(userId: string): Promise<ProfileWithRelations> {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
      include: PROFILE_INCLUDE,
    });
    if (existing) {
      return existing as ProfileWithRelations;
    }
    const created = await this.prisma.profile.create({
      data: { userId },
      include: PROFILE_INCLUDE,
    });
    return created as ProfileWithRelations;
  }

  async ownerView(userId: string): Promise<ProfileOwnerView> {
    const profile = await this.ensureProfile(userId);
    return toOwnerView(profile, this.photoUrl);
  }

  async publicView(profileId: string): Promise<ProfileView> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        visibility: true,
        photos: { orderBy: { sortOrder: 'asc' as const } },
        user: { select: { status: true } },
      },
    });

    if (!profile || profile.user.status === 'DELETED' || profile.user.status === 'PENDING_COMPLIANCE') {
      throw errors.notFound('That profile is not available.');
    }

    if (profile.user.status !== 'ACTIVE') {
      throw errors.notFound('That profile is not available.');
    }

    if (profile.status === 'PAUSED') {
      throw errors.forbidden(ErrorCode.PROFILE_PAUSED, 'This member has paused their profile.');
    }

    return toPublicView(profile as ProfileWithRelations, this.photoUrl);
  }

  async update(userId: string, input: ProfileUpdateInput): Promise<ProfileOwnerView> {
    await this.ensureProfile(userId);

    if (input.dateOfBirth !== undefined) {
      const dob = new Date(`${input.dateOfBirth}T00:00:00.000Z`);
      if (!isAdult(dob, new Date(), 18)) {
        throw errors.forbidden(
          ErrorCode.AGE_RESTRICTED,
          'KodeCupid is only available to people aged 18 and over.',
          { minimumAge: 18 },
        );
      }
    }

    const data: Prisma.ProfileUpdateInput = {};

    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.dateOfBirth !== undefined) {
      data.dateOfBirth = new Date(`${input.dateOfBirth}T00:00:00.000Z`);
    }
    if (input.genderIdentity !== undefined) data.genderIdentity = input.genderIdentity;
    if (input.genderIdentityOther !== undefined) {
      data.genderIdentityOther = input.genderIdentityOther;
    }
    if (input.interestedIn !== undefined) data.interestedIn = input.interestedIn;

    if (input.profession !== undefined) data.profession = input.profession;
    if (input.employerName !== undefined) data.employerName = input.employerName;
    if (input.shiftSchedule !== undefined) data.shiftSchedule = input.shiftSchedule;
    if (input.shiftNotes !== undefined) data.shiftNotes = input.shiftNotes;

    if (input.city !== undefined) data.city = input.city;
    if (input.region !== undefined) data.region = input.region;
    if (input.country !== undefined) data.country = input.country;
    if (input.latitude !== undefined) data.latitude = input.latitude;
    if (input.longitude !== undefined) data.longitude = input.longitude;

    if (input.religion !== undefined) data.religion = input.religion;
    if (input.ethnicity !== undefined) data.ethnicity = input.ethnicity;
    if (input.languages !== undefined) data.languages = input.languages;
    if (input.heightCm !== undefined) data.heightCm = input.heightCm;

    if (input.drinking !== undefined) data.drinking = input.drinking;
    if (input.smoking !== undefined) data.smoking = input.smoking;
    if (input.cannabis !== undefined) data.cannabis = input.cannabis;
    if (input.exercise !== undefined) data.exercise = input.exercise;

    if (input.educationLevel !== undefined) data.educationLevel = input.educationLevel;
    if (input.credentials !== undefined) data.credentials = input.credentials;

    if (input.relationshipGoals !== undefined) data.relationshipGoals = input.relationshipGoals;
    if (input.familyPlans !== undefined) data.familyPlans = input.familyPlans;
    if (input.kids !== undefined) data.kids = input.kids;
    if (input.bio !== undefined) data.bio = input.bio;

    if (input.workplaceName !== undefined) data.workplaceName = input.workplaceName;
    if (input.workplaceLatitude !== undefined) data.workplaceLatitude = input.workplaceLatitude;
    if (input.workplaceLongitude !== undefined) data.workplaceLongitude = input.workplaceLongitude;
    if (input.workplaceRadiusM !== undefined) data.workplaceRadiusM = input.workplaceRadiusM;

    const updated = await this.prisma.profile.update({
      where: { userId },
      data,
      include: PROFILE_INCLUDE,
    });

    return toOwnerView(updated as ProfileWithRelations, this.photoUrl);
  }

  async setVisibility(
    userId: string,
    field: ProfileField,
    visibility: VisibilityLevel,
  ): Promise<ProfileOwnerView> {
    if (visibility === 'MATCHED') {
      throw errors.validation('Visibility for matches only is coming in a later release.');
    }

    const profile = await this.ensureProfile(userId);

    await this.prisma.profileFieldVisibility.upsert({
      where: { profileId_field: { profileId: profile.id, field } },
      create: { profileId: profile.id, field, visibility },
      update: { visibility },
    });

    return this.ownerView(userId);
  }

  async setPaused(userId: string, paused: boolean): Promise<ProfileOwnerView> {
    await this.ensureProfile(userId);
    const updated = await this.prisma.profile.update({
      where: { userId },
      data: { status: paused ? 'PAUSED' : 'ACTIVE', pausedAt: paused ? new Date() : null },
      include: PROFILE_INCLUDE,
    });
    return toOwnerView(updated as ProfileWithRelations, this.photoUrl);
  }

  addPhoto(userId: string, file: { buffer?: Buffer; mimetype?: string; size?: number } | undefined) {
    return this.photos.add(userId, file);
  }

  removePhoto(userId: string, photoId: string) {
    return this.photos.remove(userId, photoId);
  }

  reorderPhotos(userId: string, photoIds: string[]) {
    return this.photos.reorder(userId, photoIds);
  }
}
