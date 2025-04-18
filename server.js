/*
Fullstack Hospital Data Management System
Backend: Node.js, Express.js, MongoDB
Frontend: HTML, CSS (Tailwind), JavaScript
*/

// 1. Initialize Express Server
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json());
app.use(cors());

// 2. Connect to MongoDB
const mongodb_uri=process.env.MONGO_URI;
// const mongodb_uri=process.env.MONGO_URI_LOCAL;

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
  email: String,
  password: String,
});

const Hospital = mongoose.model("Hospital", HospitalSchema);
const User = mongoose.model("User", UserSchema);

// 4. User Authentication Routes
app.get('/contact',(req,res)=>{
  res.render('contact');
});
app.get('/about',(req,res)=>{
  res.render('about');
});
app.get('/', async (req, res) => {
  const hospitals = await Hospital.find();
  res.render('index', { hospitals });
});

app.get('/signup',(req,res)=>{
    res.render('signup');
});
app.post("/signup", async (req, res) => {
  const { email, password} = req.body;
  const user = await User.findOne({ email });
  if (!user){ const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword });
  await newUser.save();
  res.json({ message: "User registered successfully" });
}else{
  res.json({message:"User already exist..."})
}
});

app.get('/login',(req,res)=>{
    res.render('login');
})

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.json({ token, redirect: "/dashboard" });
  } catch (err) {
      res.status(500).json({ error: "Server error" });
  }
});
  app.get("/dashboard",(req,res)=>{
    res.render('dashboard');
  })

app.post("/dashboard", async (req, res) => {
  try {
    const { hospitalName, bedsAvailable, patients, doctors } = req.body;

    const newHospital = new Hospital({
      hospitalName,
      bedsAvailable,
      patients,
      doctors
    });
    console.log(newHospital);
    await newHospital.save();
    res.status(201).json({ message: "Hospital added successfully" });
  } catch (error) {
    console.error("Error while saving hospital:", error);
    res.status(500).json({ error: "Server error while adding hospital" });
  }
});

app.put("/dashboard", async (req, res) => {
  try {
    const { hospitalName, bedsAvailable, patients, doctors } = req.body;

    // Check if hospital exists
    const hospital = await Hospital.findOne({ hospitalName });

    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    // Update fields (except hospital name)
    hospital.bedsAvailable = bedsAvailable;
    hospital.patients = patients;
    hospital.doctors = doctors;

    await hospital.save();

    res.status(200).json({ message: "Hospital updated successfully" });
  } catch (error) {
    console.error("Error while updating hospital:", error);
    res.status(500).json({ error: "Server error while updating hospital" });
  }
});




app.get("/hospitals", async (req, res) => {
  const hospitals = await Hospital.find();
  res.json(hospitals);
});


app.put("/hospitals/:id", async (req, res) => {
  await Hospital.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Hospital data updated" });
});

// 6. Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));