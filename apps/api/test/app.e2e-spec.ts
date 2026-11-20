import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { Agent } from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

/**
 * End-to-end coverage of the Milestone 1 Definition of Done.
 * Requires a migrated + seeded database (pnpm db:deploy && pnpm db:seed).
 */
describe('KodeCupid Milestone 1 (e2e)', () => {
  let app: INestApplication;
  let httpServer: unknown;

  const prefix = `/${process.env.API_PREFIX ?? 'api/v1'}`;
  const debugCode = process.env.OTP_DEBUG_CODE ?? '246810';

  const newPhone = () =>
    `+88017${Math.floor(10_000_000 + Math.random() * 89_999_999).toString().slice(0, 8)}`;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');
    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('health', () => {
    it('reports the API and database as reachable', async () => {
      await request(httpServer as never)
        .get(`${prefix}/health`)
        .expect(200)
        .expect((response) => {
          expect(response.body.status).toBe('ok');
        });

      await request(httpServer as never).get(`${prefix}/health/db`).expect(200);
    });
  });

  describe('registration → compliance → onboarding → profile', () => {
    const agent: Agent = request.agent(httpServer as never);
    const phone = newPhone();
    let accessCookie: string | undefined;
    let profileId: string | undefined;

    it('rejects an invalid phone number', async () => {
      await agent
        .post(`${prefix}/auth/otp/request`)
        .send({ phone: '12', countryCode: 'BD' })
        .expect(400);
    });

    it('sends an OTP and verifies it', async () => {
      const otp = await agent
        .post(`${prefix}/auth/otp/request`)
        .send({ phone, countryCode: 'BD' })
        .expect(200);

      expect(otp.body.challengeId).toBeTruthy();

      const verified = await agent
        .post(`${prefix}/auth/otp/verify`)
        .send({ challengeId: otp.body.challengeId, code: debugCode })
        .expect(200);

      expect(verified.body.created).toBe(true);
      expect(verified.body.session.compliance.required).toBe(true);

      const cookies = verified.headers['set-cookie'] as unknown as string[];
      accessCookie = cookies?.find((cookie) => cookie.startsWith('kc_at='));
      expect(accessCookie).toBeTruthy();
    });

    it('blocks protected routes until the age gate is completed', async () => {
      const response = await agent.get(`${prefix}/profile/me`).expect(403);
      expect(response.body.error.code).toBe('COMPLIANCE_REQUIRED');
    });

    it('blocks under-18 registrations', async () => {
      const underageDob = new Date();
      underageDob.setUTCFullYear(underageDob.getUTCFullYear() - 17);

      const response = await agent
        .post(`${prefix}/compliance/accept`)
        .send({
          dateOfBirth: underageDob.toISOString().slice(0, 10),
          confirmAdult: true,
          acceptTerms: true,
          acceptGuidelines: true,
          termsVersion: process.env.TERMS_VERSION ?? '1.0',
          guidelinesVersion: process.env.GUIDELINES_VERSION ?? '1.0',
        })
        .expect(403);

      expect(response.body.error.code).toBe('AGE_RESTRICTED');
    });

    it('requires explicit acceptance of both legal documents', async () => {
      await agent
        .post(`${prefix}/compliance/accept`)
        .send({
          dateOfBirth: '1995-05-05',
          confirmAdult: true,
          acceptTerms: false,
          acceptGuidelines: true,
          termsVersion: process.env.TERMS_VERSION ?? '1.0',
          guidelinesVersion: process.env.GUIDELINES_VERSION ?? '1.0',
        })
        .expect(400);
    });

    it('accepts compliant registrations', async () => {
      const response = await agent
        .post(`${prefix}/compliance/accept`)
        .send({
          dateOfBirth: '1995-05-05',
          confirmAdult: true,
          acceptTerms: true,
          acceptGuidelines: true,
          termsVersion: process.env.TERMS_VERSION ?? '1.0',
          guidelinesVersion: process.env.GUIDELINES_VERSION ?? '1.0',
        })
        .expect(200);

      expect(response.body.compliance.required).toBe(false);
      expect(response.body.onboarding.completed).toBe(false);
    });

    it('saves each onboarding step and resumes from the server', async () => {
      await agent.patch(`${prefix}/onboarding/steps/welcome`).send({}).expect(200);

      await agent
        .patch(`${prefix}/onboarding/steps/identity`)
        .send({
          displayName: 'Test Member',
          dateOfBirth: '1995-05-05',
          genderIdentity: 'WOMAN',
          interestedIn: ['MEN'],
        })
        .expect(200);

      const state = await agent.get(`${prefix}/onboarding/state`).expect(200);
      expect(state.body.completedSteps).toEqual(expect.arrayContaining(['welcome', 'identity']));
      expect(state.body.nextStep).toBe('profession');

      await agent
        .patch(`${prefix}/onboarding/steps/profession`)
        .send({ profession: 'Registered Nurse', shiftSchedule: 'NIGHT' })
        .expect(200);

      await agent
        .patch(`${prefix}/onboarding/steps/location`)
        .send({ city: 'Dhaka', country: 'BD' })
        .expect(200);

      await agent
        .patch(`${prefix}/onboarding/steps/preferences`)
        .send({ lookingFor: ['LONG_TERM'], ageRangeMin: 25, ageRangeMax: 40, maxDistanceKm: 30 })
        .expect(200);

      await agent
        .patch(`${prefix}/onboarding/steps/privacy`)
        .send({ visibility: [{ field: 'RELIGION', visibility: 'HIDDEN' }] })
        .expect(200);
    });

    it('completes onboarding only once every step is saved', async () => {
      const response = await agent.post(`${prefix}/onboarding/complete`).expect(200);
      expect(response.body.onboarding.completed).toBe(true);
    });

    it('applies privacy defaults and explicit overrides to the public view', async () => {
      const owner = await agent
        .patch(`${prefix}/profile/me`)
        .send({ religion: 'Islam', ethnicity: 'Bengali', workplaceName: 'City Hospital' })
        .expect(200);

      profileId = owner.body.id;
      expect(profileId).toBeTruthy();

      const publicView = await agent.get(`${prefix}/profiles/${profileId}`).expect(200);
      expect(publicView.body.religion).toBeUndefined();
      expect(publicView.body.workplaceName).toBeUndefined();
      expect(publicView.body.hiddenFields).toEqual(
        expect.arrayContaining(['RELIGION', 'WORKPLACE']),
      );

      await agent
        .put(`${prefix}/profile/me/visibility`)
        .send({ field: 'RELIGION', visibility: 'PUBLIC' })
        .expect(200);

      const revealed = await agent.get(`${prefix}/profiles/${profileId}`).expect(200);
      expect(revealed.body.religion).toBe('Islam');
      expect(revealed.body.hiddenFields).not.toContain('RELIGION');
    });

    it('hides paused profiles from other members but keeps the owner view', async () => {
      await agent.post(`${prefix}/profile/me/pause`).expect(200);

      const response = await agent.get(`${prefix}/profiles/${profileId}`).expect(403);
      expect(response.body.error.code).toBe('PROFILE_PAUSED');

      const owner = await agent.get(`${prefix}/profile/me`).expect(200);
      expect(owner.body.status).toBe('PAUSED');

      await agent.post(`${prefix}/profile/me/resume`).expect(200);
    });

    it('keeps the session alive through a refresh rotation', async () => {
      const refresh = await agent.post(`${prefix}/auth/refresh`).expect(200);
      expect(refresh.body.session.user.id).toBeTruthy();

      await agent.get(`${prefix}/auth/me`).expect(200);
    });
  });

  describe('admin roles', () => {
    const superAgent: Agent = request.agent(httpServer as never);
    const moderatorAgent: Agent = request.agent(httpServer as never);

    it('signs both seeded roles in', async () => {
      const superLogin = await superAgent
        .post(`${prefix}/admin/auth/login`)
        .send({
          email: process.env.SEED_ADMIN_EMAIL ?? 'admin@kodecupid.test',
          password: process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!Admin1',
        })
        .expect(200);
      expect(superLogin.body.admin.role).toBe('SUPER_ADMIN');

      const moderatorLogin = await moderatorAgent
        .post(`${prefix}/admin/auth/login`)
        .send({
          email: process.env.SEED_MODERATOR_EMAIL ?? 'moderator@kodecupid.test',
          password: process.env.SEED_MODERATOR_PASSWORD ?? 'ChangeMe!Mod1',
        })
        .expect(200);
      expect(moderatorLogin.body.admin.role).toBe('MODERATOR');
    });

    it('gives the Moderator the member list', async () => {
      const response = await moderatorAgent.get(`${prefix}/admin/users`).expect(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('refuses role management, settings and member deletion to the Moderator', async () => {
      await moderatorAgent.get(`${prefix}/admin/admins`).expect(403);
      await moderatorAgent.get(`${prefix}/admin/settings`).expect(403);
      await moderatorAgent.get(`${prefix}/admin/monetization`).expect(403);
      await moderatorAgent.delete(`${prefix}/admin/users/anything`).expect(403);
    });

    it('allows the Moderator into the queues they own', async () => {
      await moderatorAgent.get(`${prefix}/admin/complaints`).expect(200);
      await moderatorAgent.get(`${prefix}/admin/verification`).expect(200);
      await moderatorAgent.get(`${prefix}/admin/deletion-requests`).expect(200);
    });

    it('lets the Super Admin reach everything', async () => {
      const users = await superAgent.get(`${prefix}/admin/users`).expect(200);
      expect(users.body.items.length).toBeGreaterThan(0);

      await superAgent.get(`${prefix}/admin/admins`).expect(200);
      await superAgent.get(`${prefix}/admin/settings`).expect(200);
      await superAgent.get(`${prefix}/admin/monetization`).expect(200);
      await superAgent.get(`${prefix}/admin/audit`).expect(200);
    });

    it('changes a role by email and refuses to remove the last Super Admin', async () => {
      const invitation = await superAgent
        .post(`${prefix}/admin/admins/invite`)
        .send({ email: 'new.moderator@kodecupid.test', role: 'MODERATOR' })
        .expect(201);

      expect(invitation.body.inviteToken).toBeTruthy();

      const list = await superAgent.get(`${prefix}/admin/admins`).expect(200);
      const superAdmin = list.body.admins.find(
        (admin: { role: string }) => admin.role === 'SUPER_ADMIN',
      );

      const response = await superAgent
        .patch(`${prefix}/admin/admins/${superAdmin.id}/role`)
        .send({ role: 'MODERATOR' })
        .expect(409);

      expect(response.body.error.code).toBe('LAST_SUPER_ADMIN');
    });
  });
});
