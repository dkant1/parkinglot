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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
dotenv.config();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// app.get("/")--> GET on the root will be handled automatically by sending index.html from public folder

app.use("/api/parkinglots", parkingLotRouter);
app.use("/api/parkingslots", parkingSlotRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/auth",authRouter);
app.use("/register", registerRouter);


app.get("*", (req, res) => {
  res.status(404).sendFile("/public/error.html", { root: __dirname });
});

app.listen(process.env.PORT, () => {
  console.log("Server listening on :" + process.env.PORT);
});
