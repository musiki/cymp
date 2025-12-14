import type { APIRoute } from "astro";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "astro:db";

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  secret: process.env.AUTH_SECRET || import.meta.env.AUTH_SECRET || "",
  baseURL: process.env.BETTER_AUTH_URL || import.meta.env.BETTER_AUTH_URL || "http://localhost:4321",
});

export const GET: APIRoute = async (context) => {
  return auth.handler(context.request);
};

export const POST: APIRoute = async (context) => {
  return auth.handler(context.request);
};
