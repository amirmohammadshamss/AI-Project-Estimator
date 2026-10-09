import { validationTexts } from '../content/login-validation';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(validationTexts.enterAValidEmailAddress),
  password: z.string().min(1, validationTexts.passwordIsRequired),
});
