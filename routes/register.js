"use strict";
import express from "express";
import pool from "../db.js";
import bcrypt from 'bcrypt';


const router = express.Router();

router.post("/", async(req,res)=>{
    try {
        const hashedPwd = await bcrypt.hash(req.body.password,10);
        await pool.query("INSERT INTO users(email, passcode, mobile) VALUES($1, $2, $3)",[ req.body.email, hashedPwd, req.body.mobile]);
        res.status(201).json("Registration Successful");

    } catch (error) {
        res.status(400).json({ error: error.message });
    }   
});


export default router;