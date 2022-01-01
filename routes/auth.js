"use strict";
import express from "express";
import pool from "../db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';



const router = express.Router();

router.post("/login", async(req,res)=>{
    try {
        const result = await pool.query("SELECT * FROM users WHERE email = ($1)", [req.body.email]);
        if (result.rows.length < 1)
            throw "Email not registered!";
        
        if( await bcrypt.compare(req.body.password, result.rows[0].passcode)){

            const accessToken = jwt.sign({user:req.body.email}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
            const refreshToken = jwt.sign({user:req.body.email}, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '15d' });
            //Insert the refresh_token into the users table
             await pool.query("UPDATE users SET refresh_token = ($1) WHERE email = ($2)", [refreshToken, req.body.email]);


            res.json({accessToken: accessToken, refreshToken:refreshToken});
        }
        else
            throw "Password does not match!";
            
    } catch (error) {
        res.status(400).json({Error : error.message});
    }
});

router.post("/refresh_token", async(req,res)=>{
    //Refresh_token should be sent as part of the POST body
    // refresh_token : slkdfnssflksff
    const refreshToken   = req.body.refresh_token;
    if(refreshToken == null) res.status(401).json({Error: "Unauthorized"});
    try{
    //search for incoing refresh token in the list of refresh tokens on server.
    const result = await pool.query("SELECT refresh_token FROM users WHERE refresh_token = ($1)", [refreshToken]);
    if (result.rows.length == 0) return res.status(403).json({Error : "Forbidden"});
    }
    catch(error){
        return res.status(403).json({Error: error.message});
    }
    //If found
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user)=>{
        if (err) return res.status(403).json({Error : "Forbidden"});
        const accessToken = jwt.sign({user : user.email}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
        res.json({accessToken: accessToken });
    });

});

router.delete("/logout", async(req, res)=>{
    //Delete the refresh token from the server.

    try {
        const result = await pool.query("UPDATE users SET refresh_token = null WHERE refresh_token = ($1)", [req.body.refresh_token]);
        if (result.rowCount != 1) 
            res.status(403).json({Error: "Forbidden"});
        res.status(204);
    } catch (error) {
        res.status(500).json({Error : error.message});
    }
});

export default router;