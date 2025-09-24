import express from "express";
import { getProducts, addProduct } from "../controllers/productController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route
router.get("/", getProducts);

// Admin route (protected with authMiddleware)
router.post("/", authMiddleware, addProduct);

export default router;
