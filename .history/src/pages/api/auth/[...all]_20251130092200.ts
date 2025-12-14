import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";

export const GET: APIRoute = async (context) => {
  return auth.handler(context.request);
};

export const POST: APIRoute = async (context) => {
  return auth.handler(context.request);
};
