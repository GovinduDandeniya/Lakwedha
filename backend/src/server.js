const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");

const doctorChannelingRouter = require("./doctor-channeling/index");
const doctorController = require("./doctor-channeling/controllers/doctor.controller");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ── MongoDB (optional — controllers fall back to mock data if not connected) ──
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));
} else {
  console.log("No MONGODB_URI set — running with mock data");
}

// ── Auth ─────────────────────────────────────────────────────────────────────
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey123";

const users = [
  { id: 1, username: "sandaru", password: bcrypt.hashSync("1234", 8) }
];

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(404).send("User not found");
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).send("Invalid password");
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
  res.send({ message: "Login successful", token });
});

// ── Doctor channeling routes ──────────────────────────────────────────────────
app.use("/doctor-channeling", doctorChannelingRouter);

// ── Doctor availability by name ───────────────────────────────────────────────
app.get("/api/doctor-availability", doctorController.getDoctorAvailabilityByName);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
