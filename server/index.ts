import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically with optimized settings for audio quality
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Optimize for audio files
    if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.flac') || path.endsWith('.m4a') || path.endsWith('.ogg')) {
      // Disable compression for audio files to maintain quality
      res.setHeader('Content-Encoding', 'identity');
      // Set proper audio content types
      if (path.endsWith('.mp3')) {
        res.setHeader('Content-Type', 'audio/mpeg');
      } else if (path.endsWith('.wav')) {
        res.setHeader('Content-Type', 'audio/wav');
      } else if (path.endsWith('.flac')) {
        res.setHeader('Content-Type', 'audio/flac');
      } else if (path.endsWith('.m4a')) {
        res.setHeader('Content-Type', 'audio/mp4');
      } else if (path.endsWith('.ogg')) {
        res.setHeader('Content-Type', 'audio/ogg');
      }
      // Enable range requests for better streaming
      res.setHeader('Accept-Ranges', 'bytes');
      // Cache for better performance but not too long
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
  // Don't use etag for audio files as they should be immutable
  etag: false,
  // Enable range support for audio streaming
  acceptRanges: true
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
