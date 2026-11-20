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
import {
  MAX_PHOTO_BYTES,
  photoOrderSchema,
  profileUpdateSchema,
  visibilityUpdateSchema,
  type PhotoOrderInput,
  type ProfileOwnerView,
  type ProfileUpdateInput,
  type ProfileView,
  type VisibilityUpdateInput,
} from '@kodecupid/shared';
import { CurrentMember } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ComplianceGuard } from '../auth/compliance.guard';
import { MemberAuthGuard } from '../auth/member-auth.guard';
import { ProfileService } from './profile.service';

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

  @Put('profile/me/visibility')
  @HttpCode(200)
  setVisibility(
    @CurrentMember() member: { user: { id: string } },
    @Body(new ZodValidationPipe(visibilityUpdateSchema)) body: VisibilityUpdateInput,
  ): Promise<ProfileOwnerView> {
    return this.profile.setVisibility(member.user.id, body.field, body.visibility);
  }

  @Post('profile/me/pause')
  @HttpCode(200)
  pause(@CurrentMember() member: { user: { id: string } }): Promise<ProfileOwnerView> {
    return this.profile.setPaused(member.user.id, true);
  }

  @Post('profile/me/resume')
  @HttpCode(200)
  resume(@CurrentMember() member: { user: { id: string } }): Promise<ProfileOwnerView> {
    return this.profile.setPaused(member.user.id, false);
  }

  @Post('profile/me/photos')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } }))
  async addPhoto(
    @CurrentMember() member: { user: { id: string } },
    @UploadedFile() file: { buffer?: Buffer; mimetype?: string; size?: number } | undefined,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['addPhoto']>> }> {
    const photos = await this.profile.addPhoto(member.user.id, file);
    return { photos };
  }

  @Delete('profile/me/photos/:id')
  async removePhoto(
    @CurrentMember() member: { user: { id: string } },
    @Param('id') photoId: string,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['removePhoto']>> }> {
    const photos = await this.profile.removePhoto(member.user.id, photoId);
    return { photos };
  }

  @Patch('profile/me/photos/order')
  async reorderPhotos(
    @CurrentMember() member: { user: { id: string } },
    @Body(new ZodValidationPipe(photoOrderSchema)) body: PhotoOrderInput,
  ): Promise<{ photos: Awaited<ReturnType<ProfileService['reorderPhotos']>> }> {
    const photos = await this.profile.reorderPhotos(member.user.id, body.photoIds);
    return { photos };
  }

  /** Member-facing profile of another account, filtered by their privacy toggles. */
  @Get('profiles/:id')
  async viewProfile(@Param('id') profileId: string): Promise<ProfileView> {
    return this.profile.publicView(profileId);
  }
}
