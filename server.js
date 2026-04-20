import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// 🚨 ENV SAFETY CHECK (CRITICAL)
// =========================
if (MONGO_URI) {
  console.error("❌ MONGO_URI missing");
  process.exit(1); // HARD STOP (prevents crash loop)
}

// =========================
// 🔗 MongoDB CONNECT (STABLE)
// =========================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => {
  console.error("MongoDB Error ❌", err);
  process.exit(1); // STOP if DB fails
});

// =========================
// 🧠 SCHEMA
// =========================
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  password: String,
  phone: String,
  email: String,

  study: { type: Number, default: 0 },
  focus: { type: Number, default: 0 },
  distraction: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// =========================
// 🔥 TRK GENERATOR (100% SAFE)
// =========================
function generateTRK() {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const checksum = Math.floor(Math.random() * 90 + 10);

  return `TRK-${year}-IN-${random}-${checksum}`;
}

// =========================
// 🔥 SIGNUP
// =========================
app.post("/api/signup", async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if (!phone || !email || !password) {
      return res.json({ success: false, message: "Missing fields" });
    }

    const userId = generateTRK();

    const user = new User({
      userId,
      phone,
      email,
      password
    });

    await user.save();

    res.json({ success: true, userId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// =========================
// 🔐 LOGIN (FULLY SAFE)
// =========================
app.post("/api/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.json({ success: false, message: "Missing credentials" });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.password !== password) {
      return res.json({ success: false, message: "Wrong password" });
    }

    res.json({ success: true, status: "OTP_REQUIRED" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// =========================
// 🔐 OTP
// =========================
app.post("/api/verify-otp", (req, res) => {
  const { otp } = req.body;

  if (otp === 1234) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// =========================
// 📊 TRACKING
// =========================
app.post("/api/track", async (req, res) => {
  try {
    const { userId, study = 0, focus = 0, distraction = 0 } = req.body;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.study += study;
    user.focus += focus;
    user.distraction += distraction;

    await user.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Tracking failed" });
  }
});

// =========================
// 📊 STATS
// =========================
app.get("/api/stats/:userId", async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.json({
        study: 0,
        focus: 0,
        distraction: 0
      });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stats error" });
  }
});

// =========================
// TEST
// =========================
app.get("/", (req, res) => {
  res.send("🚀 Traksha Backend Live");
});

// =========================
// 🚀 SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});