import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createOrder, getOrders } from "../controllers/orderController.js";
import { handleStatusUpdate } from "../services/orderStatusService.js";

const router = express.Router();

// POST /api/orders - Create order (public for WhatsApp, but can be authenticated)
router.post("/", createOrder);

// GET /api/orders - Get orders (requires authentication)
router.get("/", authMiddleware, getOrders);

// PATCH /api/orders/:orderId/status - Update order status (public for webhooks)
router.patch("/:orderId/status", handleStatusUpdate);

export default router;
