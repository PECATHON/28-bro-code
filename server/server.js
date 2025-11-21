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
import getMenu from "./routes/getMenu.js";


const app = express();
const port = process.env.PORT || 3000;

// CORS SAFE FOR EXPO + WEB + REAL DEVICES
const defaultOrigins = ["http://localhost:5173", "http://localhost:19006"];
const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(s => s.trim())
  : [];

const whitelist = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return cb(null, true);
    }
    
    // Allow whitelisted origins
    if (whitelist.includes(origin)) {
      return cb(null, true);
    }
    
    // Allow local network IPs (for real devices on same WiFi)
    // This regex matches common local network IP ranges:
    // - 192.168.x.x
    // - 10.0.x.x
    // - 172.16-31.x.x
    // - localhost variants
    const localNetworkRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/;
    if (localNetworkRegex.test(origin)) {
      console.log("✅ Allowed local network origin:", origin);
      return cb(null, true);
    }
    
    console.log("⚠️ Blocked CORS origin:", origin);
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
app.use("/api/menu", getMenu); // GET /api/menu/items?vendor_id=... (MUST come before menuRoutes - more specific route first)
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