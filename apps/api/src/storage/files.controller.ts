import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service';

/**
 * Serves locally stored images. Public by design: photo URLs are unguessable
 * random keys, and profile visibility is enforced when the profile is loaded.
 */
@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get(':key')
  async get(@Param('key') key: string, @Res() response: Response): Promise<void> {
    const file = await this.storage.read(key);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    response.setHeader('Content-Type', file.contentType);
    response.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.send(file.body);
  }
}
