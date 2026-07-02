import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import authOtpRouter from "./auth-otp";
import authGoogleRouter from "./auth-google";
import authBiometricRouter from "./auth-biometric";
import pushNotificationsRouter from "./push-notifications";
import investmentsRouter from "./investments";
import transactionsRouter from "./transactions";
import notificationsRouter from "./notifications";
import portfolioRouter from "./portfolio";
import profileRouter from "./profile";
import paymentsRouter from "./payments";
import adminRouter from "./admin";
import kycRouter from "./kyc";
import platformRouter from "./platform";
import runMigrationRouter from "./run-migration"; // ONE-TIME MIGRATION

const router: IRouter = Router();

router.use(runMigrationRouter); // ONE-TIME MIGRATION - DELETE AFTER USE
router.use(healthRouter);
router.use(authRouter);
router.use(authOtpRouter);
router.use(authGoogleRouter);
router.use(authBiometricRouter);
router.use(pushNotificationsRouter);
router.use(investmentsRouter);
router.use(transactionsRouter);
router.use(notificationsRouter);
router.use(portfolioRouter);
router.use(profileRouter);
router.use(paymentsRouter);
router.use(adminRouter);
router.use(kycRouter);
router.use(platformRouter);

export default router;
