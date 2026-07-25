import type { NextConfig } from "next";

/**
 * Two build targets:
 *
 *   next build                 → a static site in ./out, deployable to GitHub
 *                                Pages, Netlify, S3 — anything that serves files.
 *   NF_SERVER=1 next build     → the previous Node/standalone output, for hosts
 *                                that run a server.
 *
 * Static is the default because the game needs no backend: all progress lives
 * in localStorage and the submission form validates client-side.
 *
 * NF_BASE_PATH is for project-scoped GitHub Pages (e.g. "/NATURALIS-FUTURA"),
 * where the site is not served from the domain root.
 */
const base = process.env.NF_BASE_PATH || "";

const nextConfig: NextConfig = process.env.NF_SERVER
  ? { output: "standalone" }
  : {
      output: "export",
      images: { unoptimized: true },
      trailingSlash: true,
      ...(base ? { basePath: base, assetPrefix: base } : {}),
    };

export default nextConfig;
