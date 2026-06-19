require("dotenv").config();
const express = require("express");
const cors = require("cors");
const otpRoutes = require("./otpRoute");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Gmail OTP API is running",
    version: "1.0.0",
    env: {
      GMAIL_USER:     process.env.GMAIL_USER     ? "SET ✅" : "MISSING ❌",
      GMAIL_APP_PASS: process.env.GMAIL_APP_PASS ? "SET ✅" : "MISSING ❌",
    },
    endpoints: {
      sendOtp:   "POST /api/send-otp",
      verifyOtp: "POST /api/verify-otp",
    },
  });
});

app.use("/api", otpRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅  Server running on port ${PORT}`);
  console.log(`GMAIL_USER     : ${process.env.GMAIL_USER     ? "SET ✅" : "MISSING ❌"}`);
  console.log(`GMAIL_APP_PASS : ${process.env.GMAIL_APP_PASS ? "SET ✅" : "MISSING ❌"}`);
});
