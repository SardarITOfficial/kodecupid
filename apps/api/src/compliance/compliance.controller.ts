import { Body, Controller, ForbiddenException, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  complianceAcceptSchema,
  type ComplianceAcceptInput,
  type ComplianceDocumentView,
  type MemberSession,
} from '@kodecupid/shared';
import { ClientMeta, CurrentMember } from '../common/decorators';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { MemberAuthGuard } from '../auth/member-auth.guard';
import type { MemberRecord } from '../auth/auth.types';
import type { RequestMeta } from '../auth/auth.service';
import { ComplianceService } from './compliance.service';

/**
 * Note: only MemberAuthGuard here — the whole point of accepting the terms is
 * to satisfy ComplianceGuard, so that guard must not protect this route.
 */
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get('documents')
  documents(): { documents: ComplianceDocumentView[] } {
    return { documents: this.compliance.documents() };
  }

  @Post('accept')
  @HttpCode(200)
  @UseGuards(MemberAuthGuard)
  accept(
    @CurrentMember() member: { user: MemberRecord },
    @Body(new ZodValidationPipe(complianceAcceptSchema)) body: ComplianceAcceptInput,
    @ClientMeta() meta: RequestMeta,
  ): Promise<MemberSession> {
    if (member.user.status === 'SUSPENDED') {
      throw new ForbiddenException('This account is suspended.');
    }
    return this.compliance.accept(member.user, body, meta);
  }
}
