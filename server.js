"use strict";
/**
 * Static server for the Mohr Insurance dynamic sales script.
 *
 * Deliberately dependency-free: the whole app is one self-contained HTML file,
 * so there is nothing to install, nothing to build, and nothing to keep patched.
 * Railway deploys are just "copy the files and run node".
 */
const http = require("http");
const fs   = require("fs");
const path = require("path");
const { createHash, timingSafeEqual } = require("crypto");

/* Serve ONLY what lives in public/. Keeping the servable files in their own
   directory is what makes this safe — the server never has to reason about
   which project files ought to stay private, because none of them are here. */
const ROOT = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

/* Optional gate. Unset means the site is open, which is the default. */
const PASSWORD = process.env.APP_PASSWORD || "";
const USERNAME = process.env.APP_USERNAME || "mohr";

const TYPES = {
  ".html":"text/html; charset=utf-8",
  ".css" :"text/css; charset=utf-8",
  ".js"  :"text/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".txt" :"text/plain; charset=utf-8",
  ".pdf" :"application/pdf",
  ".png" :"image/png",
  ".jpg" :"image/jpeg",
  ".svg" :"image/svg+xml",
  ".ico" :"image/x-icon",
  ".woff2":"font/woff2"
};

/* The page is one inline <style> and one inline <script>, and it pulls its two
   typefaces from Google Fonts. Nothing else should be reachable from it. */
const CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "script-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "form-action 'none'",
  "frame-ancestors 'self'",
  "base-uri 'self'"
].join("; ");

function secure(res){
  res.setHeader("Content-Security-Policy", CSP);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
}

function authed(req){
  if(!PASSWORD) return true;
  const header = req.headers.authorization || "";
  if(!header.startsWith("Basic ")) return false;
  let given;
  try{ given = Buffer.from(header.slice(6), "base64").toString("utf8"); }
  catch(e){ return false; }
  /* compare digests so the check does not leak length or content by timing */
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(USERNAME + ":" + PASSWORD).digest();
  return timingSafeEqual(a, b);
}

function send(res, code, body, headers){
  res.writeHead(code, headers || {"Content-Type":"text/plain; charset=utf-8"});
  res.end(body);
}

const server = http.createServer((req, res) => {
  secure(res);

  /* Health check stays open so Railway can reach it without credentials. */
  if(req.url === "/healthz" || req.url === "/health")
    return send(res, 200, "ok");

  if(!authed(req)){
    res.setHeader("WWW-Authenticate", 'Basic realm="Mohr Insurance", charset="UTF-8"');
    return send(res, 401, "Authentication required.");
  }

  if(req.method !== "GET" && req.method !== "HEAD")
    return send(res, 405, "Method not allowed.", {"Allow":"GET, HEAD"});

  let pathname;
  try{ pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); }
  catch(e){ return send(res, 400, "Bad request."); }

  if(pathname === "/" || pathname === "") pathname = "/index.html";

  /* Resolve first, then confirm the result is still inside the project —
     this is what stops ../ from walking out of the directory. */
  if(pathname.split("/").some(seg => seg.startsWith(".") && seg !== ""))
    return send(res, 404, "Not found.");

  const file = path.resolve(ROOT, "." + pathname);
  if(file !== ROOT && !file.startsWith(ROOT + path.sep))
    return send(res, 403, "Forbidden.");

  fs.stat(file, (err, stat) => {
    if(err || !stat.isFile()) return send(res, 404, "Not found.");

    const ext = path.extname(file).toLowerCase();
    /* The script itself must never be served stale — an agent reloading has to
       get the current version. Everything else can sit in cache briefly. */
    res.setHeader("Cache-Control",
      ext === ".html" ? "no-cache, must-revalidate" : "public, max-age=300");
    res.setHeader("Content-Type", TYPES[ext] || "application/octet-stream");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Last-Modified", stat.mtime.toUTCString());

    if(req.method === "HEAD") return res.end();

    const stream = fs.createReadStream(file);
    stream.on("error", () => { res.destroyed || res.end(); });
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Mohr script server listening on ${HOST}:${PORT}` +
              (PASSWORD ? " (password protected)" : " (open)"));
});

/* Railway sends SIGTERM on redeploy; finish in-flight requests before exiting. */
for(const sig of ["SIGTERM","SIGINT"]) process.on(sig, () => {
  console.log(`${sig} received, shutting down.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10000).unref();
});
