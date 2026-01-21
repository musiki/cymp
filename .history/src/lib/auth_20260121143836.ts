import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

// Helper to get environment variables with fallback
function getEnv(key: string): string {
  return import.meta.env[key] || process.env[key] || "";
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: getEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
    },
  },
  secret: getEnv("AUTH_SECRET"),
  baseURL: getEnv("BETTER_AUTH_URL") || "http://localhost:4321",
});
