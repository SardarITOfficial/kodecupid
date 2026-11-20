import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import {
  MAX_PHOTO_BYTES,
  photoOrderSchema,
  profileUpdateSchema,
  visibilityBulkSchema,
  visibilityUpdateSchema,
  type PhotoOrderInput,
  type ProfileOwnerView,
  type ProfileUpdateInput,
  type ProfileView,
  type VisibilityUpdateInput,
} from '@kodecupid/shared';
import { CurrentMember } from '../common/decorators';
import { validateWith, ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ComplianceGuard } from '../auth/compliance.guard';
import { MemberAuthGuard } from '../auth/member-auth.guard';
import { ProfileService } from './profile.service';

/** Privacy can be changed one field at a time or as a batch. */
const privacyPatchSchema = z.union([visibilityUpdateSchema, visibilityBulkSchema]);

@Controller()
@UseGuards(MemberAuthGuard, ComplianceGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('profile/me')
  me(@CurrentMember() member: { user: { id: string } }): Promise<ProfileOwnerView> {
    return this.profile.ownerView(member.user.id);
  }

  @Patch('profile/me')
  update(
    @CurrentMember() member: { user: { id: string } },
    @Body(new ZodValidationPipe(profileUpdateSchema)) body: ProfileUpdateInput,
  ): Promise<ProfileOwnerView> {
    return this.profile.update(member.user.id, body);
  }

  // ── Privacy (canonical `PATCH /profile/privacy`, alias `PUT /profile/me/visibility`) ──

  @Patch('profile/privacy')
  @HttpCode(200)
  async patchPrivacy(
    @CurrentMember() member: { user: { id: string } },
    @Body() body: unknown,
  ): Promise<ProfileOwnerView> {
    const parsed = validateWith(privacyPatchSchema, body ?? {});
    if ('updates' in parsed) {
      let view = await this.profile.ownerView(member.user.id);
      for (const update of parsed.updates) {
        view = await this.profile.setVisibility(member.user.id, update.field, update.visibility);
      }
      return view;
    }
    return this.profile.setVisibility(member.user.id, parsed.field, parsed.visibility);
  }

  @Put('profile/me/visibility')
  @HttpCode(200)
  setVisibilityLegacy(
    @CurrentMember() member: { user: { id: string } },
    @Body(new ZodValidationPipe(visibilityUpdateSchema)) body: VisibilityUpdateInput,
  ): Promise<ProfileOwnerView> {
    return this.profile.setVisibility(member.user.id, body.field, body.visibility);
  }

  // ── Pause / resume ────────────────────────────────────────────────────────

  @Patch('profile/pause')
  @HttpCode(200)
  pause(@CurrentMember() member: { user: { id: string } }): Promise<ProfileOwnerView> {
    return this.profile.setPaused(member.user.id, true);
  }

  @Patch('profile/resume')
  @HttpCode(200)
  resume(@CurrentMember() member: { user: { id: string } }): Promise<ProfileOwnerView> {
    return this.profile.setPaused(member.user.id, false);
  }

  @Post('profile/me/pause')
  @HttpCode(200)
  pauseLegacy(@CurrentMember() member: { user: { id: string } }): Promise<ProfileOwnerView> {
    return this.profile.setPaused(member.user.id, true);
  }

  @Post('profile/me/resume')
  @HttpCode(200)
  resumeLegacy(@CurrentMember() member: { user: { id: string } }): Promise<ProfileOwnerView> {
    return this.profile.setPaused(member.user.id, false);
  }

  // ── Photos (canonical `/profile/photos`, alias `/profile/me/photos`) ─────

  @Post('profile/photos')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }))
  addPhoto(
    @CurrentMember() member: { user: { id: string } },
    @UploadedFile() file: { buffer?: Buffer; mimetype?: string; size?: number } | undefined,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['addPhoto']>> }> {
    return this.addPhotoFor(member.user.id, file);
  }

  @Post('profile/me/photos')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }))
  addPhotoLegacy(
    @CurrentMember() member: { user: { id: string } },
    @UploadedFile() file: { buffer?: Buffer; mimetype?: string; size?: number } | undefined,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['addPhoto']>> }> {
    return this.addPhotoFor(member.user.id, file);
  }

  @Delete('profile/photos/:photoId')
  removePhoto(
    @CurrentMember() member: { user: { id: string } },
    @Param('photoId') photoId: string,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['removePhoto']>> }> {
    return this.removePhotoFor(member.user.id, photoId);
  }

  @Delete('profile/me/photos/:id')
  removePhotoLegacy(
    @CurrentMember() member: { user: { id: string } },
    @Param('id') photoId: string,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['removePhoto']>> }> {
    return this.removePhotoFor(member.user.id, photoId);
  }

  @Patch('profile/photos/order')
  reorderPhotos(
    @CurrentMember() member: { user: { id: string } },
    @Body(new ZodValidationPipe(photoOrderSchema)) body: PhotoOrderInput,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['reorderPhotos']>> }> {
    return this.reorderFor(member.user.id, body.photoIds);
  }

  @Patch('profile/me/photos/order')
  reorderPhotosLegacy(
    @CurrentMember() member: { user: { id: string } },
    @Body(new ZodValidationPipe(photoOrderSchema)) body: PhotoOrderInput,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['reorderPhotos']>> }> {
    return this.reorderFor(member.user.id, body.photoIds);
  }

  /** Member-facing profile of another account, filtered by their privacy toggles. */
  @Get('profiles/:id')
  async viewProfile(@Param('id') profileId: string): Promise<ProfileView> {
    return this.profile.publicView(profileId);
  }

  private async addPhotoFor(
    userId: string,
    file: { buffer?: Buffer; mimetype?: string; size?: number } | undefined,
  ) {
    const photos = await this.profile.addPhoto(userId, file);
    return { photos };
  }

  private async removePhotoFor(userId: string, photoId: string) {
    const photos = await this.profile.removePhoto(userId, photoId);
    return { photos };
  }

  private async reorderFor(userId: string, photoIds: string[]) {
    const photos = await this.profile.reorderPhotos(userId, photoIds);
    return { photos };
  }
}
