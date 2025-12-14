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
	// Si la ruta empieza con /dashboard (o /api/private, etc.)
	if (url.pathname.startsWith("/dashboard")) {
		// Verificamos si hay un usuario en la sesión
		const user = await locals.auth.user();
		// Si no hay usuario, lo redirigimos a la página de login
		if (!user) return redirect("/login?redirect=/dashboard");
	}
	// Si todo está en orden, continuamos con la petición.
	return next();
});