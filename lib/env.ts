import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url("Invalid DATABASE_URL"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  REDIS_URL: z.string().optional(),
  EASYTHUNDER_API_KEY: z.string().optional(),
  EASYTHUNDER_API_SECRET: z.string().optional(),
  EASYSLIP_API_KEY: z.string().optional(),
  COMMIT_SHA: z.string().default("dev"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = z.prettifyError(result.error);
    console.error("❌ Environment validation failed:");
    console.error(errors);

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  return result.success ? result.data : (process.env as unknown as Env);
}

export const env = validateEnv();
