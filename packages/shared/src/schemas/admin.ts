import { z } from 'zod';
import { ADMIN_ROLE_VALUES, ADMIN_STATUS_VALUES, USER_STATUS_VALUES } from '../enums';
import { PERMISSIONS } from '../permissions';
import { emailSchema, passwordSchema } from './common';

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(72),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const inviteAdminSchema = z.object({
  email: emailSchema,
  role: z.enum(ADMIN_ROLE_VALUES),
});

export type InviteAdminInput = z.infer<typeof inviteAdminSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(20).max(120),
  name: z.string().trim().min(2).max(60),
  password: passwordSchema,
});

export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const updateAdminRoleSchema = z.object({
  role: z.enum(ADMIN_ROLE_VALUES),
});

export const updateAdminStatusSchema = z.object({
  status: z.enum(ADMIN_STATUS_VALUES),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(USER_STATUS_VALUES),
});

export type UpdateMemberStatusInput = z.infer<typeof updateMemberStatusSchema>;

/**
 * Role assignment by email. If the email already belongs to an admin the role
 * is applied immediately; otherwise a pending invitation is created and the
 * response carries a one-time token to hand over.
 */
export const roleAssignSchema = z.object({
  email: emailSchema,
  role: z.enum(ADMIN_ROLE_VALUES),
});

export type RoleAssignInput = z.infer<typeof roleAssignSchema>;

export const roleUpdateSchema = z.object({
  role: z.enum(ADMIN_ROLE_VALUES),
});

export type RoleUpdateInput = z.infer<typeof roleUpdateSchema>;

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length),
});

export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;