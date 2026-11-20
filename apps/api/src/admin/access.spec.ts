import { ADMIN_NAV, ADMIN_ROLE_VALUES, can, navFor, PERMISSIONS } from '@kodecupid/shared';

/**
 * The role matrix is the contract the client tests: a Moderator must never be
 * able to reach a Super Admin action, in the API or in the navigation.
 */
describe('admin permission matrix', () => {
  it('gives the Super Admin every permission', () => {
    for (const permission of PERMISSIONS) {
      expect(can('SUPER_ADMIN', permission)).toBe(true);
    }
  });

  it('limits the Moderator to the queue and read permissions', () => {
    expect(can('MODERATOR', 'users.read')).toBe(true);
    expect(can('MODERATOR', 'complaints.write')).toBe(true);
    expect(can('MODERATOR', 'verification.read')).toBe(true);
    expect(can('MODERATOR', 'deletion.read')).toBe(true);
    expect(can('MODERATOR', 'corrections.write')).toBe(true);

    expect(can('MODERATOR', 'users.write')).toBe(false);
    expect(can('MODERATOR', 'users.delete')).toBe(false);
    expect(can('MODERATOR', 'admins.manage')).toBe(false);
    expect(can('MODERATOR', 'settings.read')).toBe(false);
    expect(can('MODERATOR', 'monetization.read')).toBe(false);
    expect(can('MODERATOR', 'audit.read')).toBe(false);
  });

  it('builds a different navigation per role', () => {
    const superNav = navFor('SUPER_ADMIN').map((item) => item.key);
    const moderatorNav = navFor('MODERATOR').map((item) => item.key);

    expect(superNav).toContain('roles');
    expect(superNav).toContain('settings');
    expect(superNav).toContain('monetization');
    expect(superNav).toContain('users');

    expect(moderatorNav).toContain('users');
    expect(moderatorNav).toContain('complaints');
    expect(moderatorNav).not.toContain('roles');
    expect(moderatorNav).not.toContain('settings');
    expect(moderatorNav).not.toContain('monetization');
  });

  it('has no admin nav entry without a matching permission', () => {
    for (const item of ADMIN_NAV) {
      expect(PERMISSIONS).toContain(item.permission);
      expect(can('SUPER_ADMIN', item.permission)).toBe(true);
    }
  });

  it('keeps exactly two roles', () => {
    expect(ADMIN_ROLE_VALUES).toEqual(['SUPER_ADMIN', 'MODERATOR']);
  });
});
