# Gmail OTP Verification Backend

A free email OTP verification backend using **Node.js + Express + Nodemailer + Gmail**. No domain needed. No credit card. Sends to any email worldwide.

---

## Architecture

```
Netlify Frontend
       │
       ▼
Render Backend  (this repo)
       │
       ▼
Gmail (Nodemailer)
       │
       ▼
OTP Email → Any User Email
       │
       ▼
User enters OTP → Verified ✅
```

---

## Project Structure

```
gmail-otp/
├── server.js        # Express app, CORS, middleware, error handlers
├── otpRoute.js      # /api/send-otp and /api/verify-otp logic
├── package.json     # Dependencies + npm start script
├── package-lock.json
├── .env.example     # Environment variable template
└── .gitignore       # Ignores node_modules and .env
```

---

## Environment Variables

| Variable         | Description                              | Example                      |
|------------------|------------------------------------------|------------------------------|
| `GMAIL_USER`     | Your Gmail address                       | `yourgmail@gmail.com`        |
| `GMAIL_APP_PASS` | Gmail App Password (16 chars)            | `abcd efgh ijkl mnop`        |
| `PORT`           | Server port (default: 3000)              | `3000`                       |
| `FRONTEND_URL`   | *(Optional)* Netlify URL for CORS lock   | `https://your-site.netlify.app` |

> ⚠️ Never use your real Gmail password. Use App Password only.  
> ⚠️ Never commit `.env` to GitHub. It is listed in `.gitignore`.

---

## Gmail App Password Setup

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. **Security** → **2-Step Verification** → Turn **ON**
3. Search **"App Passwords"** in your Google Account
4. Select **Mail** → Click **Generate**
5. Copy the 16-character password → paste into `GMAIL_APP_PASS`

> App Password looks like: `abcd efgh ijkl mnop`  
> With or without spaces both work ✅

---

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/gmail-otp.git
cd gmail-otp

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in GMAIL_USER and GMAIL_APP_PASS in .env

# 4. Start the server
npm start
```

Server runs at `http://localhost:3000`

---

## API Reference

### `GET /`

Health check — confirms server is running and env vars are set.

**Response**
```json
{
  "status": "ok",
  "message": "Gmail OTP API is running",
  "version": "1.0.0",
  "env": {
    "GMAIL_USER": "SET ✅",
    "GMAIL_APP_PASS": "SET ✅"
  },
  "endpoints": {
    "sendOtp": "POST /api/send-otp",
    "verifyOtp": "POST /api/verify-otp"
  }
}
```

---

### `POST /api/send-otp`

Generates a 6-digit OTP and sends it to the given email via Gmail.

**Request Body**
```json
{
  "email": "user@gmail.com"
}
```

**Success Response** `200`
```json
{
  "success": true,
  "message": "OTP sent successfully. Check your email.",
  "email": "user@gmail.com"
}
```

**Error Response** `400 / 500`
```json
{
  "success": false,
  "message": "Invalid email address."
}
```

---

### `POST /api/verify-otp`

Verifies the OTP entered by the user. OTP expires in 10 minutes.

**Request Body**
```json
{
  "email": "user@gmail.com",
  "otp": "123456"
}
```

**Success Response** `200`
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "email": "user@gmail.com"
}
```

**Wrong OTP** `400`
```json
{
  "success": false,
  "message": "Incorrect OTP. Please try again."
}
```

**Expired OTP** `400`
```json
{
  "success": false,
  "message": "OTP expired. Please request a new one."
}
```

---

## Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting           | Value         |
|-------------------|---------------|
| **Runtime**       | Node          |
| **Build Command** | `npm install` |
| **Start Command** | `npm start`   |

5. Add environment variables:

```
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASS=abcd efgh ijkl mnop
PORT=3000
FRONTEND_URL=https://your-site.netlify.app
```

6. Click **Deploy** ✅

---

## Connecting from Netlify Frontend

```js
const API = "https://your-service.onrender.com";

// Send OTP
const sendOtp = async (email) => {
  const res = await fetch(`${API}/api/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
};

// Verify OTP
const verifyOtp = async (email, otp) => {
  const res = await fetch(`${API}/api/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  return res.json();
};
```

---

## Error Reference

| Error Code | Cause | Fix |
|------------|-------|-----|
| `EAUTH` | Wrong App Password | Re-generate App Password in Google |
| `EAUTH` | Used real Gmail password | Must use App Password only |
| `MISSING ❌` | Env var not set | Add to Render Environment |
| Email in spam | Gmail filter | Ask users to check spam folder |

---

## OTP Rules

- **6 digits** — e.g. `362265`
- **Expires in 10 minutes**
- **One-time use** — deleted after successful verification
- Works with **any email** — Gmail, Yahoo, Outlook, etc.

---

## Comparison

| | SMS (Twilio) | Email (Gmail) |
|---|---|---|
| **Cost** | Paid | ✅ Free |
| **Any number/email** | ❌ Trial limit | ✅ Yes |
| **Domain needed** | ❌ | ❌ |
| **Setup** | Complex | Simple |

---

## Dependencies

| Package      | Purpose                         |
|--------------|---------------------------------|
| `express`    | HTTP server and routing         |
| `cors`       | Cross-origin request handling   |
| `dotenv`     | Loads `.env` into `process.env` |
| `nodemailer` | Sends email via Gmail SMTP      |

---

## License

MIT
