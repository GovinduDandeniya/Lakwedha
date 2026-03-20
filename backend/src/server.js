const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Secret key for JWT
const SECRET_KEY = "mysecretkey123";

// Fake user database (example)
const users = [
  {
    id: 1,
    username: "sandaru",
    password: bcrypt.hashSync("1234", 8)
  }
];


// LOGIN API
app.post("/login", (req, res) => {

  const { username, password } = req.body;

  // find user
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).send("User not found");
  }

  // check password
  const passwordIsValid = bcrypt.compareSync(password, user.password);

  if (!passwordIsValid) {
    return res.status(401).send("Invalid password");
  }

  // create token
  const token = jwt.sign(
    { id: user.id, username: user.username },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.send({
    message: "Login successful",
    token: token
  });

});


// Middleware to verify token
function verifyToken(req, res, next) {

  const bearerHeader = req.headers["authorization"];

  if (!bearerHeader) {
    return res.status(403).send("Token required");
  }

  const token = bearerHeader.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {

    if (err) {
      return res.status(401).send("Invalid token");
    }

    req.user = decoded;
    next();
  });

}


// Protected route
app.get("/students", verifyToken, (req, res) => {

  res.send({
    message: "Protected student data",
    user: req.user
  });

});
// ── Notification Module Routes ───────────────────────────────────────────────
const otpRoutes = require("./routes/otpRoutes");
const notificationAppointmentRoutes = require("./routes/notificationAppointmentRoutes");
const errorHandler = require("./middleware/errorHandler");

app.use("/api/v1/otp", otpRoutes);
app.use("/api/v1/notification", notificationAppointmentRoutes);

// Global Error Handler should be the last middleware
app.use(errorHandler);


// Start server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});

app.get('/', (req, res) => {
  res.send('Backend is running!');
});
