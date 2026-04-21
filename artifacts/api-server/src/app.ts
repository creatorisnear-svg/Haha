import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

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
