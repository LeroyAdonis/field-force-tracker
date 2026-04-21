import http from "http";
import { auth } from "./src/lib/auth";
import { db, user, account } from "./src/lib/db";
import { eq } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";

const PORT = process.env.PORT || 3000;
const VITE_PORT = process.env.VITE_PORT || 5173;
const VITE_URL = `http://localhost:${VITE_PORT}`;

async function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      resolve(body);
    });
  });
}

async function nodeToWebRequest(nodeReq: http.IncomingMessage, body: string): Promise<Request> {
  const headers = new Headers();
  Object.entries(nodeReq.headers).forEach(([key, value]) => {
    if (typeof value === "string") headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value[0]);
  });

  return new Request(`http://localhost:${PORT}${nodeReq.url}`, {
    method: nodeReq.method,
    headers,
    body: ["GET", "HEAD"].includes(nodeReq.method || "") ? undefined : body,
  });
}

async function handleSignIn(body: string): Promise<Response> {
  try {
    const { email, password } = JSON.parse(body);

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!foundUser) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const foundAccount = await db.query.account.findFirst({
      where: eq(account.userId, foundUser.id),
    });

    if (!foundAccount || !foundAccount.password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validPassword = await verifyPassword(password, foundAccount.password);

    if (!validPassword) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        user: {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          emailVerified: foundUser.emailVerified,
        },
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sign-in error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const server = http.createServer(async (req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/api/auth/sign-in" && req.method === "POST") {
    console.log(`[SIGNIN] Processing sign-in`);
    try {
      const body = await readBody(req);
      const response = await handleSignIn(body);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
    } catch (error) {
      console.error("Sign-in error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  if (req.url?.startsWith("/api/auth")) {
    console.log(`[AUTH] Processing ${req.url}`);
    try {
      const body = await readBody(req);
      const webReq = await nodeToWebRequest(req, body);
      const response = await auth.handler(webReq);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(response.body);
    } catch (error) {
      console.error("Auth error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  try {
    const body = await readBody(req);
    const proxyUrl = new URL(req.url || "/", VITE_URL).toString();
    const proxyReq = await fetch(proxyUrl, {
      method: req.method,
      headers: Object.fromEntries(
        Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || ""])
      ),
      body: ["GET", "HEAD"].includes(req.method || "") ? undefined : body,
    });

    res.writeHead(proxyReq.status, Object.fromEntries(proxyReq.headers));
    const proxyBody = await proxyReq.arrayBuffer();
    res.end(Buffer.from(proxyBody));
  } catch (error) {
    console.error("Proxy error:", error);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Bad gateway" }));
  }
});

server.listen(PORT, () => {
  console.log(`\n✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Auth endpoint: http://localhost:${PORT}/api/auth/sign-in\n`);
});
