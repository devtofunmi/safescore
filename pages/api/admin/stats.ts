import type { NextApiRequest, NextApiResponse } from "next";
import {
  isAdmin,
  getGlobalAccuracy,
  getTotalUsers,
  getUserCounts,
} from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Admin Stats API
 * Returns global statistics for the admin dashboard
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user is admin
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required" });
    }

    // Fetch all stats in parallel
    const [accuracy, totalUsers, userCounts, historyData] = await Promise.all([
      getGlobalAccuracy(),
      getTotalUsers(),
      getUserCounts(),
      supabaseAdmin.from("history").select("predictions"),
    ]);

    // Calculate total predictions generated
    let totalPredictions = 0;
    if (historyData.data) {
      historyData.data.forEach((record: any) => {
        if (record.predictions && Array.isArray(record.predictions)) {
          totalPredictions += record.predictions.length;
        }
      });
    }

    return res.status(200).json({
      accuracy: accuracy.accuracy,
      totalPredictions,
      totalUsers,
      proUsers: userCounts.pro,
      freeUsers: userCounts.free,
      won: accuracy.won,
      lost: accuracy.lost,
      pending: accuracy.pending,
      postponed: accuracy.postponed,
    });
  } catch (err: any) {
    console.error("[Admin Stats API] Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
