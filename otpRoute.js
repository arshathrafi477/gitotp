const express    = require("express");
const router     = express.Router();
const nodemailer = require("nodemailer");

// ─── In-Memory OTP Store ──────────────────────────────────────────────────────
// { "user@gmail.com": { otp: "123456", expiresAt: timestamp } }
const otpStore = {};

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS, // Gmail App Password (16 chars)
    },
  });
}

function missingEnv() {
  return !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS;
}

// ─── POST /api/send-otp ───────────────────────────────────────────────────────

router.post("/send-otp", async (req, res) => {
  if (missingEnv()) {
    console.error("❌ Missing GMAIL_USER or GMAIL_APP_PASS");
    return res.status(500).json({
      success: false,
      message: "Email service is not configured.",
    });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "Invalid email address." });
  }

  const otp       = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Save OTP
  otpStore[email.toLowerCase()] = { otp, expiresAt };

  const mailOptions = {
    from: `"OTP Verification" <${process.env.GMAIL_USER}>`,
    to:   email,
    subject: "Your OTP Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-bottom: 8px;">Verification Code</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Use the code below to verify your email address.<br/>
          It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #111827;">
            ${otp}
          </span>
        </div>
        <p style="color: #9ca3af; font-size: 13px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ OTP sent → ${email} | messageId: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Check your email.",
      email,
    });

  } catch (err) {
    console.error("❌ Send OTP error:");
    console.error("   Code    :", err.code);
    console.error("   Message :", err.message);

    // Common Gmail errors
    if (err.code === "EAUTH") {
      return res.status(500).json({
        success: false,
        message: "Gmail authentication failed. Check GMAIL_USER and GMAIL_APP_PASS.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
});

// ─── POST /api/verify-otp ─────────────────────────────────────────────────────

router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required.",
    });
  }

  if (!/^\d{6}$/.test(otp.trim())) {
    return res.status(400).json({
      success: false,
      message: "OTP must be 6 digits.",
    });
  }

  const key    = email.toLowerCase();
  const record = otpStore[key];

  // Not found
  if (!record) {
    return res.status(400).json({
      success: false,
      message: "OTP not found. Please request a new one.",
    });
  }

  // Expired
  if (Date.now() > record.expiresAt) {
    delete otpStore[key];
    return res.status(400).json({
      success: false,
      message: "OTP expired. Please request a new one.",
    });
  }

  // Wrong OTP
  if (record.otp !== otp.trim()) {
    return res.status(400).json({
      success: false,
      message: "Incorrect OTP. Please try again.",
    });
  }

  // ✅ Correct — delete so it can't be reused
  delete otpStore[key];

  console.log(`✅ OTP verified → ${email}`);

  return res.status(200).json({
    success: true,
    message: "Email verified successfully.",
    email,
  });
});

module.exports = router;
