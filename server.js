import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// =========================
// 🧠 SCHEMA (UPGRADED)
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
// 🔥 SIGNUP API
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

    res.json({
      success: true,
      userId
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// 🔐 LOGIN API (REAL)
// =========================
app.post("/api/login", async (req, res) => {
  const { userId, password } = req.body;

  const user = await User.findOne({ userId });

  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  if (user.password !== password) {
    return res.json({ success: false, message: "Wrong password" });
  }

  return res.json({
    success: true,
    status: "OTP_REQUIRED"
  });
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
// 🔥 TRACKING
// =========================
app.post("/api/track", async (req, res) => {
  try {
    const { userId, study = 0, focus = 0, distraction = 0 } = req.body;

    let user = await User.findOne({ userId });

    if (!user) {
      return res.json({ success: false });
    }

    user.study += study;
    user.focus += focus;
    user.distraction += distraction;

    await user.save();

    res.json({ success: true });

  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// 📊 STATS
// =========================
app.get("/api/stats/:userId", async (req, res) => {
  const user = await User.findOne({ userId: req.params.userId });

  if (!user) {
    return res.json({
      study: 0,
      focus: 0,
      distraction: 0
    });
  }

  res.json(user);
});

// =========================
// TEST
// =========================
app.get("/", (req, res) => {
  res.send("Traksha Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running...");
});
