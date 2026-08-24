import { z } from 'zod';

const passwordSchema = z.string().min(12).max(256);

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().max(320),
    password: passwordSchema,
    displayName: z.string().min(1).max(120),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(320),
    password: z.string().min(1).max(256),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().max(320),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(32).max(512),
    password: passwordSchema,
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(256),
    nextPassword: passwordSchema,
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    role: z.enum(['user', 'researcher', 'admin']),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    accountStatus: z.enum(['active', 'suspended', 'disabled']),
  }),
});

export const adminUserQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    role: z.enum(['user', 'researcher', 'admin']).optional(),
    accountStatus: z.enum(['active', 'suspended', 'disabled']).optional(),
  }),
});
