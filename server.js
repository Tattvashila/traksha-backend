import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔗 MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// 🧠 SCHEMA
const userSchema = new mongoose.Schema({
  userId: String,
  study: { type: Number, default: 0 },
  focus: { type: Number, default: 0 },
  distraction: { type: Number, default: 0 }
});

const User = mongoose.model("User", userSchema);

// 🔥 SAVE TRACKING
app.post("/api/track", async (req, res) => {
  try {
    const { userId, study = 0, focus = 0, distraction = 0 } = req.body;

    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({ userId, study, focus, distraction });
    } else {
      user.study += study;
      user.focus += focus;
      user.distraction += distraction;
    }

    await user.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 📊 GET STATS
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
    res.status(500).json({ error: "Server error" });
  }
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Traksha Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running...");
});