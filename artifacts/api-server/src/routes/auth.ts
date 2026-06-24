import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { notificationsTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { Resend } from "resend";

const router: IRouter = Router();

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "bonnieprincewill6@gmail.com,setonslight1@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    tier: user.tier,
    theme: user.theme,
    biometricEnabled: user.biometricEnabled,
    liquidity: user.liquidity,
    isAdmin: user.isAdmin,
    emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl,
    bankName: user.bankName,
    bankAccountNumber: user.bankAccountNumber,
    bankAccountName: user.bankAccountName,
    cryptoWithdrawAddress: user.cryptoWithdrawAddress,
    cryptoWithdrawNetwork: user.cryptoWithdrawNetwork,
  };
}

export function tierFromWealth(wealth: number): string {
  if (wealth >= 500000) return "Diamond Ore";
  if (wealth >= 100000) return "Platinum Ore";
  if (wealth >= 25000) return "Gold Ore";
  if (wealth >= 5000) return "Silver Ore";
  return "Bronze Ore";
}

// Email function for sending pending approval notification
async function sendAccountPendingEmail(user: typeof usersTable.$inferSelect) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "BetterCapitalInvestment <no-reply@bettercapitalinvestment.com>",
      to: user.email,
      subject: "Welcome to BetterCapitalInvestment - Your Account is Under Review",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;background:#0d1419;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#131d26;border:1px solid #1e2d3d;border-radius:8px;overflow:hidden;">
                <tr><td style="height:3px;background:#f2ca50;"></td></tr>
                <tr><td style="padding:32px 40px;">
                  <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e8dcc8;letter-spacing:2px;text-transform:uppercase;">BetterCapitalInvestment</p>
                  <h1 style="margin:0 0 16px;font-size:24px;color:#e8dcc8;">Welcome! Account Under Review</h1>
                  <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Hi ${user.fullName},</p>
                  <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Thank you for signing up with BetterCapitalInvestment. Your account is currently under review by our admin team.</p>
                  <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">We'll notify you via email once your account has been approved and you can start investing.</p>
                  <p style="color:#4a5a6b;font-family:sans-serif;font-size:11px;margin-top:24px;">This typically takes 24-48 hours. Contact support@bettercapitalinvestment.com for questions.</p>
                </td></tr>
                <tr><td style="padding:16px 40px;border-top:1px solid #1e2d3d;">
                  <p style="margin:0;color:#4a5a6b;font-family:sans-serif;font-size:11px;">&copy; ${new Date().getFullYear()} BetterCapitalInvestment. All rights reserved.</p>
                  <p style="margin:4px 0 0;color:#4a5a6b;font-family:sans-serif;font-size:10px;">Developed by Setons and Kirito</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error("Failed to send pending email:", err);
  }
}

// Email function for sending account approved notification
export async function sendAccountApprovedEmail(user: typeof usersTable.$inferSelect) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "BetterCapitalInvestment <no-reply@bettercapitalinvestment.com>",
      to: user.email,
      subject: "Your BetterCapitalInvestment Account Has Been Approved!",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;background:#0d1419;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#131d26;border:1px solid #1e2d3d;border-radius:8px;overflow:hidden;">
                <tr><td style="height:3px;background:#22c55e;"></td></tr>
                <tr><td style="padding:32px 40px;">
                  <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#e8dcc8;letter-spacing:2px;text-transform:uppercase;">BetterCapitalInvestment</p>
                  <h1 style="margin:0 0 16px;font-size:24px;color:#22c55e;">🎉 Great News! Account Approved</h1>
                  <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Hi ${user.fullName},</p>
                  <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Your account has been approved! You can now log in and start investing with BetterCapitalInvestment.</p>
                  <div style="margin:24px 0;text-align:center;">
                    <a href="https://bettercapitalinvestments.netlify.app" style="display:inline-block;background:#f2ca50;color:#0d1419;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:700;font-family:sans-serif;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Login Now</a>
                  </div>
                  <p style="color:#8a9ab5;font-family:sans-serif;font-size:14px;line-height:1.6;">Start exploring our investment plans and grow your wealth with confidence.</p>
                  <p style="color:#4a5a6b;font-family:sans-serif;font-size:11px;margin-top:24px;">Need help? Contact support@bettercapitalinvestment.com</p>
                </td></tr>
                <tr><td style="padding:16px 40px;border-top:1px solid #1e2d3d;">
                  <p style="margin:0;color:#4a5a6b;font-family:sans-serif;font-size:11px;">&copy; ${new Date().getFullYear()} BetterCapitalInvestment. All rights reserved.</p>
                  <p style="margin:4px 0 0;color:#4a5a6b;font-family:sans-serif;font-size:10px;">Developed by Setons and Kirito</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
  } catch (err) {
    console.error("Failed to send approval email:", err);
  }
}

router.post("/auth/signup", async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    res.status(400).json({ message: "All fields required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = isAdminEmail(email);

  // Auto-verify email when no email service is configured (Resend API key missing)
  const autoVerify = !process.env.RESEND_API_KEY || admin;

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      fullName,
      passwordHash,
      isAdmin: admin,
      emailVerified: autoVerify,
      tier: "Bronze Ore",
      theme: "sovereign",
      biometricEnabled: false,
      liquidity: 0,
    })
    .returning();

  const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.insert(notificationsTable).values({
    id: notifId,
    userId: user.id,
    title: "Welcome to BetterCapitalInvestment",
    message: "Your account has been created and is under review. We'll notify you once it's approved.",
    timestamp: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    read: false,
    type: "success",
  });

  // Send pending approval email (non-blocking)
  if (!admin) {
    sendAccountPendingEmail(user).catch(err => console.error("Email send failed:", err));
  }

  req.session.userId = user.id;
  res.status(201).json(serializeUser(user));
});

router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ message: "This account uses Google sign-in. Please sign in with Google." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // Auto-promote admin emails
  if (isAdminEmail(email) && !user.isAdmin) {
    await db.update(usersTable).set({ isAdmin: true }).where(eq(usersTable.id, user.id));
    user.isAdmin = true;
  }

  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
  res.json(serializeUser(user));
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ message: "User not found" });
    return;
  }
  res.json(serializeUser(user));
});

router.get("/auth/inspect-db", async (_req: Request, res: Response) => {
  try {
    const tablesRes = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    let sessionsColumns: any = null;
    try {
      const colRes = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_sessions'
      `);
      sessionsColumns = colRes.rows;
    } catch (e) {
      sessionsColumns = { error: (e as Error).message };
    }
    
    res.json({
      tables: tablesRes.rows.map((r: any) => r.table_name),
      user_sessions_columns: sessionsColumns,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

router.get("/auth/test-bcrypt", async (_req: Request, res: Response) => {
  try {
    const hash = await bcrypt.hash("test1234", 10);
    const valid = await bcrypt.compare("test1234", hash);
    res.json({ success: true, hash, valid });
  } catch (err: any) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

export default router;
export { ADMIN_EMAILS };
