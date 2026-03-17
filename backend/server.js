// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch((err) => {
    console.log("❌ Connection Error:", err);
});

// Test Route
app.get("/", (req, res) => {
    res.send("Lakwedha API Running 🚀");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
});
