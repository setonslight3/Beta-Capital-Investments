import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, investmentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/platform/stats", async (_req: Request, res: Response) => {
  try {
    // Hardcoded buffer that always gets added
    const AUM_BUFFER = 4500000; // $4.5M buffer
    const INVESTORS_BUFFER = 2000; // 2000 investor buffer

    const investments = await db.select().from(investmentsTable);
    const activeInvestments = investments.filter((i) => i.status === "active");
    const totalAUM = activeInvestments.reduce((s, i) => s + i.amount, 0);

    const allUsers = await db.select().from(usersTable);
    const totalLiquidity = allUsers.reduce((s, u) => s + u.liquidity, 0);
    const totalPlatformWealth = totalLiquidity + totalAUM;

    const userCount = allUsers.length;

    // Always add buffer to real numbers
    const displayAUM = totalPlatformWealth + AUM_BUFFER;
    const displayInvestors = userCount + INVESTORS_BUFFER;

    res.json({
      aum: displayAUM,
      investors: displayInvestors,
      markets: 40,
      uptime: 99.9,
    });
  } catch (err) {
    console.error("Failed to fetch platform stats:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
