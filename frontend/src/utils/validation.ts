import { z } from 'zod';

export const emailSchema = z.string().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/\d/, 'Must contain a number');

export function confirmPasswordSchema<T extends Record<string, any>>(
  refPath: keyof T
) {
  return z
    .string()
    .min(1, 'Confirm password is required')
    .refine(
      (val, ctx) => {
        const root = ctx.parent as T;
        return val === root[refPath];
      },
      { message: 'Passwords do not match' }
    );
}

export function requiredString(
  fieldName: string = 'Field',
  min: number = 1,
  max: number = 255
) {
  return z
    .string()
    .min(min, `${fieldName} is required`)
    .max(max, `${fieldName} must be at most ${max} characters`);
}

export const phoneSchema = z
  .string()
  .min(8, 'Phone number too short')
  .regex(/^[+\d\s\-\(\)]+$/, 'Invalid phone format');

export const positiveNumber = z.union([
  z.number().positive('Must be a positive number'),
  z
    .string()
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      { message: 'Must be a positive number' }
    ),
]);

export const dateSchema = z.coerce.date().refine(
  (date) => !isNaN(date.getTime()),
  { message: 'Invalid date' }
);

export function requiredSelect(fieldName: string = 'Selection') {
  return z.string().min(1, `${fieldName} is required`);
}
