// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import "./db.js";

import authRoutes from "./routes/auth/index.js";
import vendorRoutes from "./routes/auth/vendors.js";
import vendorRegisterRoute from "./routes/vendor/registerVendor.js";
import menuRoutes from "./routes/menu.js"; // Full CRUD menu routes
import getVendors from "./routes/getVendors.js";
import paymentRoutes from "./routes/payment.js";
import ordersRoutes from "./routes/orders.js";


const app = express();
const port = process.env.PORT || 3000;

// CORS SAFE FOR EXPO + WEB
const defaultOrigins = ["http://localhost:5173", "http://localhost:19006"];
const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(s => s.trim())
  : [];

const whitelist = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Expo native (no origin header)
    if (whitelist.includes(origin)) return cb(null, true);
    console.log("Blocked CORS:", origin);
    cb(new Error("CORS blocked"));
  },
  credentials: true,
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/vendors", getVendors); // GET /api/vendors/items (MUST come before vendorRoutes - more specific route first)
app.use("/api/vendors", vendorRoutes); // GET /api/vendors/:vendorId
app.use("/api/menu", menuRoutes); // Full CRUD: GET, POST, PUT, DELETE, import, export, upload
app.use("/api/vendor", vendorRegisterRoute);
app.use("/api/payment", paymentRoutes); // Razorpay payment routes
app.use("/api/orders", ordersRoutes); // Orders CRUD: GET /api/orders?userId=..., GET /api/orders/:orderId

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${port}`);
  console.log("CORS whitelist:", whitelist);
});