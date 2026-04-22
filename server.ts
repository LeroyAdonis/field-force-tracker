import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/lib/auth";

const app = express();
const PORT = process.env.PORT || 3000;
const VITE_PORT = process.env.VITE_PORT || 5173;
const VITE_URL = `http://localhost:${VITE_PORT}`;

// Custom CORS middleware for credentials: true and OPTIONS
app.use((req, res, next) => {
  const allowedOrigins = ["http://localhost:5173", "http://localhost:8080"];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Auth handler registered before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

// Proxy for other requests
app.use(async (req, res) => {
  try {
    const proxyUrl = new URL(req.url || "/", VITE_URL).toString();
    const proxyReq = await fetch(proxyUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${VITE_PORT}`,
      } as HeadersInit,
      body: ["GET", "HEAD"].includes(req.method || "") ? undefined : JSON.stringify(req.body),
    });

    res.status(proxyReq.status);
    for (const [key, value] of proxyReq.headers.entries()) {
      res.setHeader(key, value);
    }
    const proxyBody = await proxyReq.arrayBuffer();
    res.end(Buffer.from(proxyBody));
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(502).json({ error: "Bad gateway" });
  }
});

app.listen(PORT, () => {
  console.log(`✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Auth endpoint: http://localhost:${PORT}/api/auth\n`);
});
