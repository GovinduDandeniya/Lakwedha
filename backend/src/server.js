// Import required packages
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

// Create Express app
const app = express();

// Enable JSON and CORS
app.use(express.json());
app.use(cors());

// Secret key for JWT (you can change this)
const SECRET_KEY = "mysecretkey123";


// Fake database (for beginner testing)
const users = [
  {
    id: 1,
    username: "sandaru",
    password: bcrypt.hashSync("1234", 8) // hashed password
  }
];


// ================= LOGIN API =================
app.post("/login", (req, res) => {

  const { username, password } = req.body;

  // Check if user exists
  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(404).json({
      message: "User not found"
    });
  }

  // Check password
  const passwordIsValid = bcrypt.compareSync(password, user.password);

  if (!passwordIsValid) {
    return res.status(401).json({
      message: "Invalid password"
    });
  }

  // Create JWT token
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username
    },
    SECRET_KEY,
    {
      expiresIn: "1h"
    }
  );

  // Send token to client
  res.json({
    message: "Login successful",
    token: token
  });

});


// ================= TOKEN VERIFICATION MIDDLEWARE =================
function verifyToken(req, res, next) {

  const header = req.headers["authorization"];

  if (!header) {
    return res.status(403).json({
      message: "Token required"
    });
  }

  const token = header.split(" ")[1];

  jwt.verify(token, SECRET_KEY, (err, decoded) => {

    if (err) {
      return res.status(401).json({
        message: "Invalid token"
      });
    }

    req.user = decoded;
    next();
  });

}


// ================= PROTECTED API =================
app.get("/students", verifyToken, (req, res) => {

  res.json({
    message: "Protected student data",
    loggedInUser: req.user
  });

});


// ================= START SERVER =================
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});