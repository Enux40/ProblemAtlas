import { z } from "zod";

export const newsletterSignupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  firstName: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  source: z.string().trim().min(1).default("homepage"),
  interests: z.array(z.string().trim()).default([])
});

export type NewsletterSignupInput = z.infer<typeof newsletterSignupSchema>;
