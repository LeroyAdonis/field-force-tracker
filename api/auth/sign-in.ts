import { db, user, account } from "../../src/lib/db/index.js";
import { eq } from "drizzle-orm";
import { verifyPassword } from "better-auth/crypto";

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find user by email
    const foundUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });

    if (!foundUser) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find account with password
    const foundAccount = await db.query.account.findFirst({
      where: eq(account.userId, foundUser.id),
    });

    if (!foundAccount || !foundAccount.password) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify password
    const validPassword = await verifyPassword(password, foundAccount.password);

    if (!validPassword) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return user info (without password)
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
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `auth-token=${foundUser.id}; Path=/; HttpOnly`,
        },
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
