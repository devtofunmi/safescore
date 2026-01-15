import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

/**
 * Admin Login API
 * Authenticates admin users and returns session token
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return res.status(401).json({
        error: "Authentication failed",
        message: authError.message,
      });
    }

    if (!authData.user) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // Verify admin status (server-side)
    const adminStatus = await isAdmin(authData.user.id);
    if (!adminStatus) {
      return res.status(403).json({
        error: "Access denied",
        message: "Admin privileges required",
      });
    }

    // Return session data
    return res.status(200).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        user_metadata: authData.user.user_metadata,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        expires_in: authData.session.expires_in,
      },
    });
  } catch (err: any) {
    console.error("[Admin Login API] Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
