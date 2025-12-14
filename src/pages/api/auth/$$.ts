import type { APIRoute } from "astro";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "astro:db";

export const prerender = false;

// Initialize auth directly in the endpoint with hardcoded values for testing
const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: "481535760491-ltqsuo9sred19cbdbo1lu3u21s7g02g6.apps.googleusercontent.com",
      clientSecret: "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",
    },
  },
  secret: "7b271f441de821df715b1c48fcbe4236e5e2149c1ae74ea468ea5eae23aa73ef",
  baseURL: "http://localhost:4321",
});

export const GET: APIRoute = async ({ request }) => {
  return await auth.handler(request);
};

export const POST: APIRoute = async ({ request }) => {
  return await auth.handler(request);
};
