import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createOrder,
  getOrders,
  getOrderById,
  saveDeliveryPhoto,
  saveCustomerSignature,
  saveKYCData,
} from "../controllers/orderController.js";
import { handleStatusUpdate } from "../services/orderStatusService.js";

const router = express.Router();

// POST /api/orders - Create order (public for WhatsApp, but can be authenticated)
router.post("/", createOrder);

// GET /api/orders - Get orders (requires authentication)
router.get("/", authMiddleware, getOrders);

// GET /api/orders/:id - Get single order by ID (requires authentication)
router.get("/:id", authMiddleware, getOrderById);

// POST /api/orders/:orderId/photo - Save delivery photo (requires authentication)
router.post("/:orderId/photo", authMiddleware, saveDeliveryPhoto);

// POST /api/orders/:orderId/signature - Save customer signature (requires authentication)
router.post("/:orderId/signature", authMiddleware, saveCustomerSignature);

// POST /api/orders/:orderId/kyc - Save KYC data (requires authentication)
router.post("/:orderId/kyc", authMiddleware, saveKYCData);

// PATCH /api/orders/:orderId/status - Update order status (public for webhooks)
router.patch("/:orderId/status", handleStatusUpdate);

export default router;
