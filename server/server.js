// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./db.js";
import authRoutes from "./routes/auth/index.js";
import menuRoute from "./routes/getMenu.js";
//  172.31.68.127

const app = express();
const port = process.env.PORT || 3000;

// === CORS configuration for Expo / web / mobile ===
//
// - For web (Vite) use: http://localhost:5173
// - For Expo Web/dev server: http://localhost:19006
// - For Android emulator: use 10.0.2.2 as backend host in mobile app
// - For real devices: use your machine LAN IP (e.g. http://192.168.1.100)
//
// You can override allowed origins by setting CORS_ORIGINS in .env as
// a comma-separated list, e.g. CORS_ORIGINS=http://localhost:5173,http://localhost:19006
//
const defaultOrigins = ["http://localhost:5173", "http://localhost:19006"];
const envOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map(s => s.trim()) : [];
const whitelist = Array.from(new Set([...defaultOrigins, ...envOrigins]));

// Accept if:
// - no origin header (typical of mobile native fetch requests), OR
// - origin is in whitelist
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      // No origin (native mobile requests) — allow
      return callback(null, true);
    }
    if (whitelist.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    console.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Mount routers
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoute);

// Simple health route — optionally report supabase status if you want
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running!" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log("CORS whitelist:", whitelist);
});
