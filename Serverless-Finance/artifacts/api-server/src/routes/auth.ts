import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { notificationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
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
    accountApproved: user.accountApproved,
    avatarUrl: user.avatarUrl,
    bankName: user.bankName,
    bankAccountNumber: user.bankAccountNumber,
    bankAccountName: user.bankAccountName,
    cryptoWithdrawAddress: user.cryptoWithdrawAddress,
    cryptoWithdrawNetwork: user.cryptoWithdrawNetwork,
    frozen: user.frozen,
  };
}

export function tierFromWealth(wealth: number): string {
  if (wealth >= 500000) return "Diamond Ore";
  if (wealth >= 100000) return "Platinum Ore";
  if (wealth >= 25000) return "Gold Ore";
  if (wealth >= 5000) return "Silver Ore";
  return "Bronze Ore";
}

async function sendWelcomeEmail(user: typeof usersTable.$inferSelect) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "no-reply@bettercapitalinvestment.com",
      to: user.email,
      subject: "Welcome to BetterCapitalInvestment - Your Account is Under Review",
      html: `
        <h1>Welcome, ${user.fullName}!</h1>
        <p>Thank you for signing up with BetterCapitalInvestment. Your account is currently under review by our admin team.</p>
        <p>We'll notify you via email once your account has been approved and you can start investing.</p>
        <p>Best regards,<br/>The BetterCapitalInvestment Team</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}

export async function sendAccountApprovedEmail(user: typeof usersTable.$inferSelect) {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: "no-reply@bettercapitalinvestment.com",
      to: user.email,
      subject: "Your BetterCapitalInvestment Account Has Been Approved!",
      html: `
        <h1>Great News, ${user.fullName}!</h1>
        <p>Your account has been approved. You can now log in and start investing.</p>
        <p>Best regards,<br/>The BetterCapitalInvestment Team</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send approval email:", err);
  }
}

router.post("/auth/signup", async (req: Request, res: Response) => {
  const { email, password, fullName, phoneNumber } = req.body;
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

  const [user] = await db
    .insert(usersTable)
    .values({
      email: email.toLowerCase(),
      fullName,
      phoneNumber,
      passwordHash,
      isAdmin: admin,
      emailVerified: admin,
      accountApproved: true, // Auto-approve users
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
    message: "Your account has been created and is ready. Welcome to the platform. Please note that KYC is required for withdrawals.",
    timestamp: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
    read: false,
    type: "info",
  });

  await sendWelcomeEmail(user);

  // Log in immediately
  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));
  
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
  // Check if account is frozen
  if (user.frozen) {
    res.status(403).json({ message: "Your account has been frozen. Please contact support.", code: "ACCOUNT_FROZEN" });
    return;
  }

  if (isAdminEmail(email) && !user.isAdmin) {
    await db.update(usersTable).set({ isAdmin: true, accountApproved: true }).where(eq(usersTable.id, user.id));
    user.isAdmin = true;
    user.accountApproved = true;
  }

  if (!user.accountApproved) {
    res.status(403).json({ message: "Your account is still under review. We'll notify you once it's approved." });
    return;
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

export default router;
export { ADMIN_EMAILS };
