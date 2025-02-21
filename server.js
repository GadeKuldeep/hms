/*
Fullstack Hospital Data Management System
Backend: Node.js, Express.js, MongoDB
Frontend: HTML, CSS (Tailwind), JavaScript
*/

// 1. Initialize Express Server
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json());
app.use(cors());

// 2. Connect to MongoDB
//const mongodb_uri=process.env.MONGO_URI;
const mongodb_uri=process.env.MONGO_URI_LOCAL;

mongoose.connect(mongodb_uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 3. Define Mongoose Schemas
const HospitalSchema = new mongoose.Schema({
  hospitalName: String,
  bedsAvailable: Number,
  patients: Number,
  doctors: Number
});
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  hospitalName: String
});

const Hospital = mongoose.model("Hospital", HospitalSchema);
const User = mongoose.model("User", UserSchema);

// 4. User Authentication Routes
app.get('/',(req,res)=>{
    res.render('index');
})
app.get('/signup',(req,res)=>{
    res.render('signup');
})
app.post("/signup", async (req, res) => {
  const { username, password, hospitalName } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword, hospitalName });
  await newUser.save();
  res.json({ message: "User registered successfully" });
});

app.get('/login',(req,res)=>{
    res.render('login');
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: "User not found" });
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid password" });
  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET);
  res.json({ token });
});

app.get("/hospitals", async (req, res) => {
  const hospitals = await Hospital.find();
  res.json(hospitals);
});

app.post("/hospitals", async (req, res) => {
  const newHospital = new Hospital(req.body);
  await newHospital.save();
  res.json({ message: "Hospital added successfully" });
});

app.put("/hospitals/:id", async (req, res) => {
  await Hospital.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Hospital data updated" });
});

// 6. Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
