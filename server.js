import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distServer = path.join(__dirname, "dist", "server.cjs");

if (fs.existsSync(distServer)) {
  await import("./dist/server.cjs");
} else {
  await import("./server.ts");
}

