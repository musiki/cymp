import { B, type User } from "better-auth";
import { astroDbAdapter } from "better-auth/adapters/astro-db";
import { db } from "astro:db";
import { google } from "better-auth/providers/google";

export const auth = B({
	adapter: astroDbAdapter(db),
	// Aquí configurarías tus proveedores de login (GitHub, Google, etc.)
	providers: [
		google({
			clientId: import.meta.env.GOOGLE_CLIENT_ID,
			clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
		}),
	]
});

export const onRequest = auth(async ({ locals, url, redirect }, next) => {

