import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";
import { storage } from "./storage";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional canonical-host redirect. When CANONICAL_HOST is set (e.g.
// "vaaclothing.xyz"), any request whose Host header doesn't match is
// 301-redirected to the canonical domain. This prevents visitors from
// reaching the app via the raw *.koyeb.app URL, so Cloudflare always
// sits in front. Leave unset in dev / pre-cutover.
const canonicalHost = process.env["CANONICAL_HOST"];
if (canonicalHost) {
  app.use((req, res, next) => {
    const host = req.headers.host?.toLowerCase();
    if (
      !host ||
      host === canonicalHost.toLowerCase() ||
      host === `www.${canonicalHost.toLowerCase()}`
    ) {
      return next();
    }
    res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
  });
}

app.use("/api", router);

// SEO: sitemap.xml — generated dynamically from live products so Google
// re-discovers new drops without manual updates.
app.get("/sitemap.xml", async (_req, res) => {
  const baseUrl = (canonicalHost ? `https://${canonicalHost}` : "https://vaaclothing.xyz").replace(/\/$/, "");
  const today = new Date().toISOString().split("T")[0];
  const staticPaths: { loc: string; changefreq: string; priority: string }[] = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/orders/lookup", changefreq: "monthly", priority: "0.4" },
    { loc: "/account/login", changefreq: "yearly", priority: "0.3" },
    { loc: "/account/register", changefreq: "yearly", priority: "0.3" },
  ];
  let productEntries: { loc: string; lastmod: string }[] = [];
  try {
    const products = await storage.listProducts();
    productEntries = products.map((p) => ({
      loc: `/products/${p.id}`,
      lastmod: (p.updatedAt ?? p.createdAt ?? new Date()).toISOString().split("T")[0]!,
    }));
  } catch (err) {
    logger.warn({ err }, "sitemap: failed to load products, serving static-only sitemap");
  }
  const urls = [
    ...staticPaths.map(
      (s) =>
        `  <url><loc>${baseUrl}${s.loc}</loc><lastmod>${today}</lastmod><changefreq>${s.changefreq}</changefreq><priority>${s.priority}</priority></url>`,
    ),
    ...productEntries.map(
      (p) =>
        `  <url><loc>${baseUrl}${p.loc}</loc><lastmod>${p.lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ),
  ].join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

// In production (single-service deployments like Koyeb/Render/Fly), serve the
// built frontend from ./public alongside the API. In dev we leave this off so
// the Vite dev server handles it.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "public");
if (existsSync(publicDir)) {
  app.use(
    express.static(publicDir, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  // SPA fallback: send index.html for any non-API GET that isn't a file.
  app.get(/^(?!\/api\/).*/, (req, res, next) => {
    if (req.method !== "GET") return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });
  logger.info({ publicDir }, "Serving built frontend from /public");
}

export default app;
