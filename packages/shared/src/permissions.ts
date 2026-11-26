/**
 * Role → permission matrix. The API guards and the admin navigation both read
 * from this single source, so a moderator can never see a button they cannot
 * use, and a hidden button never guards an unprotected route.
 */
import { ADMIN_ROLE_VALUES, type AdminRole } from './enums';

export const PERMISSIONS = [
  'users.read',
  'users.write',
  'users.delete',
  'admins.read',
  'admins.manage',
  'settings.read',
  'settings.write',
  'monetization.read',
  'monetization.write',
  'verification.read',
  'verification.write',
  'complaints.read',
  'complaints.write',
  'deletion.read',
  'deletion.write',
  'corrections.read',
  'corrections.write',
  'audit.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const MODERATOR_PERMISSIONS: Permission[] = [
  'users.read',
  'verification.read',
  'verification.write',
  'complaints.read',
  'complaints.write',
  'deletion.read',
  'deletion.write',
  'corrections.read',
  'corrections.write',
];

export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  MODERATOR: MODERATOR_PERMISSIONS,
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsFor(role: AdminRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Permissions that can never be granted to a non-Super-Admin role.
 * admins.manage would allow self-promotion; users.delete is also enforced by
 * role inside the API.
 */
export const SUPER_ADMIN_ONLY_PERMISSIONS: readonly Permission[] = [
  'admins.manage',
  'users.delete',
];

export interface AdminNavItem {
  key: string;
  label: string;
  href: string;
  permission: Permission;
  description: string;
  /** Sections that are permission-gated shells in Milestone 1. */
  milestone: 1 | 2;
}

export const ADMIN_NAV: AdminNavItem[] = [
  {
    key: 'users',
    label: 'Members',
    href: '/admin/users',
    permission: 'users.read',
    description: 'Search every member, review profiles and privacy settings',
    milestone: 1,
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    permission: 'users.read',
    description: 'Member counts and moderation queues at a glance',
    milestone: 1,
  },
  {
    key: 'roles',
    label: 'Roles & access',
    href: '/admin/roles',
    permission: 'admins.manage',
    description: 'Invite admins by email and change what they can do',
    milestone: 1,
  },
  {
    key: 'audit',
    label: 'Activity log',
    href: '/admin/audit',
    permission: 'audit.read',
    description: 'Every privileged action, who did it and when',
    milestone: 1,
  },
  {
    key: 'verification',
    label: 'Verification',
    href: '/admin/verification',
    permission: 'verification.read',
    description: 'Provider verification queue',
    milestone: 1,
  },
  {
    key: 'complaints',
    label: 'Complaints',
    href: '/admin/complaints',
    permission: 'complaints.read',
    description: 'Member complaints and safety reports',
    milestone: 1,
  },
  {
    key: 'deletion',
    label: 'Data deletion',
    href: '/admin/deletion-requests',
    permission: 'deletion.read',
    description: 'Member requests to delete their data',
    milestone: 1,
  },
  {
    key: 'corrections',
    label: 'Profile corrections',
    href: '/admin/corrections',
    permission: 'corrections.read',
    description: 'Requests to correct profile details',
    milestone: 1,
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    permission: 'settings.read',
    description: 'Terms versions, safety text and platform settings',
    milestone: 2,
  },
  {
    key: 'monetization',
    label: 'Monetization',
    href: '/admin/monetization',
    permission: 'monetization.read',
    description: 'Plans, pricing and revenue settings',
    milestone: 2,
  },
];

export function navFor(role: AdminRole): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => can(role, item.permission));
}

export const ALL_ROLES = ADMIN_ROLE_VALUES;