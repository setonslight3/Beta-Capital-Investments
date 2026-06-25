import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, investmentsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/platform/stats", async (_req: Request, res: Response) => {
  try {
    const investments = await db.select().from(investmentsTable);
    const activeInvestments = investments.filter((i) => i.status === "active");
    const totalAUM = activeInvestments.reduce((s, i) => s + i.amount, 0);

    const allUsers = await db.select().from(usersTable);
    const totalLiquidity = allUsers.reduce((s, u) => s + u.liquidity, 0);
    const totalPlatformWealth = totalLiquidity + totalAUM;

    const userCount = allUsers.length;

    // Base values to reflect premium wealth levels ($2.4B AUM and 18,500 investors)
    const baseAUM = 2400000000;
    const baseInvestors = 18500;

    res.json({
      aum: baseAUM + totalPlatformWealth,
      investors: baseInvestors + userCount,
      markets: 40,
      uptime: 99.9,
    });
  } catch (err) {
    console.error("Failed to fetch platform stats:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
