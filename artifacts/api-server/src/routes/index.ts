import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import requestsRouter from "./requests";
import announcementsRouter from "./announcements";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(requestsRouter);
router.use(announcementsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
