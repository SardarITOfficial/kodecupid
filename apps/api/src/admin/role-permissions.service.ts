import { Injectable } from '@nestjs/common';
import {
  ADMIN_ROLE_VALUES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  SUPER_ADMIN_ONLY_PERMISSIONS,
  type AdminRole,
  type Permission,
  type RolePermissionsView,
} from '@kodecupid/shared';
import { ErrorCode, errors } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

interface Actor {
  adminId: string;
  ip: string | null;
}

const ALL: readonly string[] = PERMISSIONS;

function isPermission(value: string): value is Permission {
  return ALL.includes(value);
}

/** Adds the matching `.read` for every `.write`, and returns canonical order. */
function normalize(requested: readonly Permission[]): Permission[] {
  const set = new Set<Permission>(requested);
  for (const permission of requested) {
    if (permission.endsWith('.write')) {
      const read = permission.replace(/\.write$/, '.read');
      if (isPermission(read)) set.add(read);
    }
  }
  return PERMISSIONS.filter((permission) => set.has(permission));
}

@Injectable()
export class RolePermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Effective permissions for a role: saved set, or the built-in defaults. */
  async permissionsFor(role: AdminRole): Promise<Permission[]> {
    if (role === 'SUPER_ADMIN') return [...PERMISSIONS];
    const row = await this.prisma.rolePermissionSet.findUnique({ where: { role } });
    if (!row) return [...ROLE_PERMISSIONS[role]];
    return row.permissions.filter(isPermission);
  }

  async listViews(): Promise<RolePermissionsView[]> {
    const rows = await this.prisma.rolePermissionSet.findMany();
    return ADMIN_ROLE_VALUES.map((role) => {
      if (role === 'SUPER_ADMIN') {
        return { role, permissions: [...PERMISSIONS], locked: true, updatedAt: null };
      }
      const row = rows.find((entry) => entry.role === role);
      return {
        role,
        permissions: row ? row.permissions.filter(isPermission) : [...ROLE_PERMISSIONS[role]],
        locked: false,
        updatedAt: row?.updatedAt.toISOString() ?? null,
      };
    });
  }

  async update(
    actor: Actor,
    role: AdminRole,
    requested: Permission[],
  ): Promise<RolePermissionsView> {
    if (role === 'SUPER_ADMIN') {
      throw errors.forbidden(
        ErrorCode.PERMISSION_DENIED,
        'Super Admin permissions cannot be changed.',
      );
    }

    const blocked = requested.filter((permission) =>
      SUPER_ADMIN_ONLY_PERMISSIONS.includes(permission),
    );
    if (blocked.length > 0) {
      throw errors.validation(
        `These permissions are reserved for Super Admins: ${blocked.join(', ')}.`,
      );
    }

    const before = await this.permissionsFor(role);
    const next = normalize(requested);

    const row = await this.prisma.rolePermissionSet.upsert({
      where: { role },
      create: { role, permissions: next, updatedById: actor.adminId },
      update: { permissions: next, updatedById: actor.adminId },
    });

    await this.audit.log({
      adminId: actor.adminId,
      action: 'role.permissions.updated',
      targetType: 'role',
      targetId: role,
      metadata: {
        added: next.filter((permission) => !before.includes(permission)),
        removed: before.filter((permission) => !next.includes(permission)),
      },
      ip: actor.ip,
    });

    return {
      role,
      permissions: next,
      locked: false,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}