import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// 🔗 MongoDB (FINAL FIX)
// =========================
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ MONGO_URL missing in ENV");
  process.exit(1);
}

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => {
    console.error("Mongo Error ❌", err);
    process.exit(1);
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
// 🔥 TRK ID GENERATOR
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
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// 🔐 LOGIN
// =========================
app.post("/api/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

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
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// 🔐 OTP
// =========================
app.post("/api/verify-otp", (req, res) => {
  const { otp } = req.body;
  res.json({ success: otp === 1234 });
});

// =========================
// 🔥 TRACK
// =========================
app.post("/api/track", async (req, res) => {
  try {
    const { userId, study = 0, focus = 0, distraction = 0 } = req.body;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.json({ success: false });
    }

    user.study += study;
    user.focus += focus;
    user.distraction += distraction;

    await user.save();

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// TEST
// =========================
app.get("/", (req, res) => {
  res.send("Traksha Backend Running 🚀");
});

// =========================
// 🚀 SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});