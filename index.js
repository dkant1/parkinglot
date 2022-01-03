"use strict";
import express from "express";
import dotenv from 'dotenv';

import path from "path";
import { fileURLToPath } from "url";
import parkingLotRouter from "./routes/parkinglots.js";
import parkingSlotRouter from "./routes/parkingslots.js";
import bookingRouter from "./routes/booking.js";
import authRouter from "./routes/auth.js";
import registerRouter from "./routes/register.js";

import bcrypt from 'bcrypt';
import pool from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
dotenv.config();

app.set("view-engine", "ejs");
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/",(req,res)=>{
  res.render("login.ejs");
}); 

// app.get("/login", (req,res)=>{
//   res.render("login.ejs");
// });

// app.post("/login", async (req, res)=>{

// });

app.get("/register", (req,res)=>{
  res.render("registration.ejs");
});

app.post("/register", async (req, res)=>{

  try {
    const hashedPwd = await bcrypt.hash(req.body.password,10);
    await pool.query("INSERT INTO users(email, passcode, mobile) VALUES($1, $2, $3)",[ req.body.email, hashedPwd, req.body.mobile]);
    res.redirect("/");
    
  } catch (error) {
    res.redirect("/register");
  }

});

app.use("/api/parkinglots", parkingLotRouter);
app.use("/api/parkingslots", parkingSlotRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/auth",authRouter);
app.use("/api/register", registerRouter);


app.get("*", (req, res) => {
  res.status(404).sendFile("/public/error.html", { root: __dirname });
});

app.listen(process.env.PORT, () => {
  console.log("Server listening on :" + process.env.PORT);
});
