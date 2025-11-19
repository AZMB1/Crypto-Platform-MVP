import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Prefer DATABASE_PUBLIC_URL (for Vercel), fallback to DATABASE_URL (for Railway)
    url: (process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL)!,
  },
  verbose: true,
  strict: true,
})

