import type { APIRoute } from "astro";
import { auth } from "../../../middleware";

export const GET: APIRoute = async (context) => {
	const { session } = await auth.validate(context);
	return auth.logout(context, session?.sessionId);
};
