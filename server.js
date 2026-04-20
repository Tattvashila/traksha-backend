import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// 🔗 MongoDB CONNECT
// =========================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => {
  console.log("Mongo Error ❌", err);
  process.exit(1);
});

// =========================
// 🧠 USER SCHEMA
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

    const existing = await User.findOne({
      $or: [{ phone }, { email }]
    });

    if (existing) {
      return res.json({
        success: false,
        message: "User already exists"
      });
    }

    const userId = generateTRK();

    const user = new User({
      userId,
      phone,
      email,
      password // plain (stable MVP)
    });

    await user.save();

    res.json({
      success: true,
      userId
    });

  } catch (err) {
    console.log("Signup Error ❌", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// 🔐 LOGIN
// =========================
app.post("/api/login", async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.json({
        success: false,
        message: "Missing credentials"
      });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    if (user.password !== password) {
      return res.json({
        success: false,
        message: "Wrong password"
      });
    }

    res.json({
      success: true,
      status: "OTP_REQUIRED"
    });

  } catch (err) {
    console.log("Login Error ❌", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// 🔐 OTP (DEMO)
// =========================
app.post("/api/verify-otp", (req, res) => {
  const { otp } = req.body;

  if (otp === 1234) {
    return res.json({ success: true });
  }

  res.json({ success: false });
});

// =========================
// 🔥 TRACK ACTIVITY
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
    console.log("Track Error ❌", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// 📊 GET STATS
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

    res.json({
      study: user.study,
      focus: user.focus,
      distraction: user.distraction
    });

  } catch (err) {
    console.log("Stats Error ❌", err);
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// 🧪 HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("Traksha Backend Running 🚀");
});

// =========================
// 🚀 SERVER START
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
