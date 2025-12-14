import { betterAuth, google, drizzleAdapter } from "better-auth";
import { db } from "astro:db";

// La API moderna usa `betterAuth` y una propiedad `database`
export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: "sqlite" }),
	providers: [
		google({
			// Es más robusto usar process.env para código de servidor
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
	]
});

export const onRequest = auth(async ({ locals, url, redirect }, next) => {
	// Si la ruta empieza con /dashboard
	if (url.pathname.startsWith("/dashboard")) {
		// Verificamos si hay un usuario en la sesión
		const user = await locals.auth.user();
		// Si no hay usuario, lo redirigimos a la página de login
		if (!user) return redirect("/login?redirect=/dashboard");
	}

	// Si todo está en orden, continuamos con la petición.
	return next();
});