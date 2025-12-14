import type { APIRoute } from "astro";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "astro:db";

export const prerender = false;

// Initialize auth directly in the endpoint
const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  secret: process.env.AUTH_SECRET || "",
  baseURL: "http://localhost:4321",
});

export const ALL: APIRoute = async ({ request }) => {
  return await auth.handler(request);
};
