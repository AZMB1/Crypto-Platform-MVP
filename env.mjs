import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    ANALYZE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true"),
    DATABASE_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    POLYGON_API_KEY: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    POLYGON_API_KEY: process.env.POLYGON_API_KEY,
  },
})
