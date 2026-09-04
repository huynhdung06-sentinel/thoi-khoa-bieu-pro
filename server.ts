import express from "express";
import path from "path";

async function startServer() {
  const app = express();

  // Determine port priority:
  // 1. APP_PORT (e.g. 6060 set by start.bat on local PC)
  // 2. DEFAULT_APP_PORT (3000 in AI Studio dev environment)
  // 3. PORT (8080 on Cloud Run)
  // 4. Default: 6060 in local dev, 8080 in production
  const isDev =
    process.env.NODE_ENV !== "production" &&
    process.env.K_SERVICE?.startsWith("ais-pre-") !== true;

  let primaryPort: number;
  if (process.env.APP_PORT) {
    primaryPort = Number(process.env.APP_PORT);
  } else if (process.env.DEFAULT_APP_PORT) {
    primaryPort = Number(process.env.DEFAULT_APP_PORT);
  } else if (process.env.PORT) {
    primaryPort = Number(process.env.PORT);
  } else {
    primaryPort = isDev ? 6060 : 8080;
  }

  app.use(express.json());

  // Health check endpoints for Cloud Run and internal probes
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is healthy", time: new Date().toISOString() });
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "Server is healthy", time: new Date().toISOString() });
  });

  // Vite middleware for development; static file serving for production
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(primaryPort, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${primaryPort} (mode: ${isDev ? "dev" : "production"})`);
  });

  // In production, if primaryPort is not 3000, also try listening on 3000 as secondary fallback
  if (!isDev && primaryPort !== 3000) {
    try {
      const secondaryServer = app.listen(3000, "0.0.0.0", () => {
        console.log("Server also listening on port 3000 as fallback");
      });
      secondaryServer.on("error", (err: Error) => {
        console.log("Secondary port 3000 listener skipped:", err.message);
      });
    } catch {
      // Ignore if port 3000 is not available
    }
  }

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, gracefully closing server...");
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

