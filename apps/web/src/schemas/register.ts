import { validationTexts } from '../content/register-validation';
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, validationTexts.nameIsRequired).max(120),
  email: z.string().email(validationTexts.enterAValidEmailAddress),
  password: z.string().min(8, validationTexts.passwordMustBeAtLeast8Characters).max(128),
});
