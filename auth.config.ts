import Google from "@auth/core/providers/google";
import { defineConfig } from "auth-astro";

const LOCALHOST_URL_RE =
  /^https?:\/\/(?:localhost|127(?:\.\d+){3}|0\.0\.0\.0)(?::\d+)?(?:\/|$)/i;

function normalizeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  const withProtocol =
    value.startsWith("http://") || value.startsWith("https://")
      ? value
      : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

const runtimeAuthUrl = normalizeUrl(
  process.env.AUTH_URL || process.env.NEXTAUTH_URL
);
const vercelRuntimeUrl = normalizeUrl(
  process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL
);

if (
  process.env.NODE_ENV === "production" &&
  vercelRuntimeUrl &&
  (!runtimeAuthUrl || LOCALHOST_URL_RE.test(runtimeAuthUrl))
) {
  process.env.AUTH_URL = vercelRuntimeUrl;
  process.env.NEXTAUTH_URL = vercelRuntimeUrl;
}

export default defineConfig({
  trustHost: true,
  providers: [
    Google({
      clientId: import.meta.env.GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: import.meta.env.AUTH_SECRET,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to home page after login
      if (url.startsWith(baseUrl)) return url;
      else if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
});
