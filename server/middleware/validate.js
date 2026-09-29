import { z } from 'zod';

export const IntakeRequestSchema = z.object({
  transcript: z.string().min(3, "Transcript too short to evaluate."),
  language: z.string().default("en-US"),
  age_group: z.enum(["infant", "child", "adult", "elderly"]).default("adult"),
  patient_name: z.string().optional().default("Anonymous")
});

export const StatusUpdateSchema = z.object({
  status: z.enum(["QUEUED", "IN_ASSESSMENT", "DISCHARGED", "ADMITTED"]).optional(),
  manual_esi_override: z.enum(["ESI_1", "ESI_2", "ESI_3", "ESI_4", "ESI_5"]).optional()
}).refine(data => data.status !== undefined || data.manual_esi_override !== undefined, {
  message: "Either status or manual_esi_override must be provided."
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid clinical email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid clinical email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name required"),
  role: z.enum(["NURSE", "DOCTOR", "ADMIN"]).default("NURSE"),
  admin_key: z.string().optional()
});

/**
 * Middleware factory for request body validation with Zod
 */
export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
    }
    return res.status(400).json({ success: false, error: err.message });
  }
};
