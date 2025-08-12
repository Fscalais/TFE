import { z } from 'zod';

export const ALLOWED_PUBLIC_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'proton.me',
  'protonmail.com',
  'icloud.com',
  'gmx.com',
  'orange.fr',
  'free.fr',
  'sfr.fr',
  'laposte.net',
  'wanadoo.fr',
];

const emailFormatRegex =
  /^[A-Za-z0-9._%+\-]{2,64}@[A-Za-z0-9\-]{1,63}(\.[A-Za-z0-9\-]{2,63})+$/;

const emailZ = z
  .string()
  .trim()
  .min(6, 'Email trop court')
  .max(254, 'Email trop long')
  .regex(emailFormatRegex, 'Format email invalide')
  .refine((e) => {
    const parts = e.toLowerCase().split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    return ALLOWED_PUBLIC_DOMAINS.includes(domain);
  }, 'Domaine non autorisé (gmail, outlook, yahoo, icloud, proton, …)');

export const registerSchema = z.object({
  email: emailZ,
  username: z.string().trim().min(3, 'Pseudo trop court').max(32, 'Pseudo trop long'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const loginSchema = z.object({
  email: emailZ,
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
