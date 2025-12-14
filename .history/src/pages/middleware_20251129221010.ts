import { B, type User } from "better-auth";
import { astroDbAdapter } from "better-auth/adapters/astro-db";
import { db } from "astro:db";

export const auth = B({
	adapter: astroDbAdapter(db),
	// Aquí configurarías tus proveedores de login (GitHub, Google, etc.)
	// providers: [ github(...) ]
});

export const onRequest = auth(async ({ locals, url, redirect }, next) => {
	if (url.pathname.startsWith("/dashboard")) {
		const user = await locals.auth.user();
		if (!user) return redirect("/login");
	}

	return next();
});