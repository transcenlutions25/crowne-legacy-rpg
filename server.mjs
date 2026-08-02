import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const projectRoot = resolve(".");
const portFlag = process.argv.indexOf("--port");
const requestedPort = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 4173;
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 4173;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", "http://localhost");
    const pathname = decodeURIComponent(requestUrl.pathname);
    let filePath = resolve(projectRoot, `.${pathname}`);

    if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const details = await stat(filePath);
    if (details.isDirectory()) filePath = resolve(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": filePath.endsWith("sw.js") ? "no-cache" : "public, max-age=300",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`Crowne Legacy is ready at http://localhost:${port}`);
});
