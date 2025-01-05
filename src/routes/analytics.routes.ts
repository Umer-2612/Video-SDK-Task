import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";

const router = Router();
const controller = AnalyticsController.getInstance();

// GET /analytics/delivery-stats - Get notification delivery statistics
router.get("/delivery-stats", controller.getDeliveryStats);

// GET /analytics/user-engagement - Get user engagement metrics
router.get("/user-engagement", controller.getUserEngagement);

export default router;
