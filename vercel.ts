import { VercelConfig } from "@vercel/config/v1";

const supabaseUrl = process.env.VITE_SUPABASE_URL?.replace(/\/$/, "");

if (supabaseUrl == null || supabaseUrl === "") {
  throw new Error(
    "VITE_SUPABASE_URL is unavailable while evaluating vercel.ts",
  );
}

export const config: VercelConfig = {
  cleanUrls: true,
  trailingSlash: false,
  headers: [
    {
      source: "/index.html",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ],
    },
    {
      source: "/((?!assets/).*)",
      headers: [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        {
          key: "Cache-Control",
          value: "no-store, no-cache, must-revalidate",
        },
        {
          key: "Service-Worker-Allowed",
          value: "/",
        },
      ],
    },
    {
      source: "/assets/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
  rewrites: [
    {
      source: "/api/og-preview",
      destination: `${supabaseUrl}/functions/v1/og-preview`,
    },
    {
      source: "/api/health",
      destination: `${supabaseUrl}/functions/v1/health`,
    },
    {
      source: "/((?!assets/|.*\\..*).*)",
      destination: "/",
    },
  ],
  crons: [
    {
      path: "/api/health",
      schedule: "0 0 * * *",
    },
  ],
};
