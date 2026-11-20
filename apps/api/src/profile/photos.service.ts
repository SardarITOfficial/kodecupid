import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import {
  ALLOWED_PHOTO_MIME,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  type ProfilePhotoView,
} from '@kodecupid/shared';
import { ErrorCode, errors } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { photosOf, type ProfileWithRelations } from './profile.mapper';

export interface UploadedPhoto {
  buffer?: Buffer;
  mimetype?: string;
  size?: number;
}

interface MagicSignature {
  mime: (typeof ALLOWED_PHOTO_MIME)[number];
  test: (buffer: Buffer) => boolean;
}

/**
 * Sniffs the real file type from its leading bytes. Trusting the client-supplied
 * MIME type would let anyone upload an HTML/SVG payload as an image.
 */
const SIGNATURES: MagicSignature[] = [
  { mime: 'image/jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    test: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async add(userId: string, file: UploadedPhoto | undefined): Promise<ProfilePhotoView[]> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { photos: true, visibility: true },
    });

    if (!profile) {
      throw errors.notFound('Profile not found');
    }

    if (!file?.buffer || file.buffer.length === 0) {
      throw errors.validation('Choose a photo to upload', {
        fieldErrors: { photo: 'Choose a photo to upload' },
      });
    }

    if (file.size && file.size > MAX_PHOTO_BYTES) {
      throw errors.validation('Photos must be 4 MB or smaller', {
        code: ErrorCode.PHOTO_INVALID,
      });
    }

    if (profile.photos.length >= MAX_PHOTOS) {
      throw errors.validation(`You can upload up to ${MAX_PHOTOS} photos`, {
        code: ErrorCode.PHOTO_LIMIT_REACHED,
      });
    }

    const detected = SIGNATURES.find((signature) => signature.test(file.buffer!));
    if (!detected || !ALLOWED_PHOTO_MIME.includes(detected.mime)) {
      throw errors.validation('Use a JPEG, PNG or WebP image', {
        code: ErrorCode.PHOTO_INVALID,
      });
    }

    let processed: Buffer;
    let width: number | undefined;
    let height: number | undefined;

    try {
      const result = await sharp(file.buffer, { failOn: 'none' })
        .rotate()
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });

      processed = result.data;
      width = result.info.width;
      height = result.info.height;
    } catch {
      throw errors.validation('That image could not be processed', {
        code: ErrorCode.UPLOAD_FAILED,
      });
    }

    const storageKey = `p_${randomUUID().replace(/-/g, '')}.webp`;
    await this.storage.save(storageKey, processed, 'image/webp');

    const isFirst = profile.photos.length === 0;
    await this.prisma.profilePhoto.create({
      data: {
        profileId: profile.id,
        storageKey,
        mimeType: 'image/webp',
        sizeBytes: processed.byteLength,
        width,
        height,
        sortOrder: profile.photos.length,
        isPrimary: isFirst,
      },
    });

    return this.listFor(profile.id);
  }

  async remove(userId: string, photoId: string): Promise<ProfilePhotoView[]> {
    const photo = await this.prisma.profilePhoto.findFirst({
      where: { id: photoId, profile: { userId } },
    });

    if (!photo) {
      throw errors.notFound('That photo does not exist');
    }

    await this.prisma.profilePhoto.delete({ where: { id: photo.id } });
    await this.storage.remove(photo.storageKey);

    if (photo.isPrimary) {
      const next = await this.prisma.profilePhoto.findFirst({
        where: { profileId: photo.profileId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.profilePhoto.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    return this.listFor(photo.profileId);
  }

  async reorder(userId: string, photoIds: string[]): Promise<ProfilePhotoView[]> {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { userId },
      include: { photos: true, visibility: true },
    });

    const owned = new Set(profile.photos.map((photo) => photo.id));
    const unknown = photoIds.filter((id) => !owned.has(id));
    if (unknown.length > 0) {
      throw errors.validation('That photo does not belong to this profile');
    }

    const ordered = [
      ...photoIds,
      ...profile.photos.map((photo) => photo.id).filter((id) => !photoIds.includes(id)),
    ];

    await this.prisma.$transaction(
      ordered.map((id, index) =>
        this.prisma.profilePhoto.update({
          where: { id },
          data: { sortOrder: index, isPrimary: index === 0 },
        }),
      ),
    );

    return this.listFor(profile.id);
  }

  async listFor(profileId: string): Promise<ProfilePhotoView[]> {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { id: profileId },
      include: { photos: true, visibility: true },
    });
    return photosOf(profile as ProfileWithRelations, (key) => this.storage.publicUrl(key));
  }
}
