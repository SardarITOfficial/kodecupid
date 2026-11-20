import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PhotosService],
  exports: [ProfileService, PhotosService],
})
export class ProfileModule {}
