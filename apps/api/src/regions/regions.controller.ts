import { Controller, Get } from '@nestjs/common';
import type { RegionLaunchStatus, RegionView } from '@kodecupid/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Public, read-only region list. Milestone 1 only needs the seeded metro
 * records (Atlanta, Charlotte) to be visible and verifiable; matching and
 * launch gating arrive with the discovery milestone.
 */
@Controller('regions')
export class RegionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(): Promise<RegionView[]> {
    const regions = await this.prisma.region.findMany({
      orderBy: [{ launchStatus: 'asc' }, { name: 'asc' }],
    });

    return regions.map((region) => ({
      id: region.id,
      slug: region.slug,
      name: region.name,
      state: region.state,
      country: region.country,
      launchStatus: region.launchStatus as RegionLaunchStatus,
      paidSubscriberThreshold: region.paidSubscriberThreshold,
      paidSubscriberCount: region.paidSubscriberCount,
      launchedAt: region.launchedAt?.toISOString() ?? null,
    }));
  }
}
