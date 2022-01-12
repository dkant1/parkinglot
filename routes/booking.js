"use strict";
import express from "express";
import pool from "../db.js";
import { findFreeSpots } from '../utils/utils.js';
import { authenticateToken } from "../middleware/authorization.js";

const router = express.Router();
// -----------------------------------------------------------------------
// CREATE a Booking
// req.body= { "date": "2021-12-28",
    // "time_from": "09:30",
    // "time_to": "10:00",
    // "size": "small",
    // "lot_id": "JY01"}
// -----------------------------------------------------------------------

router.post("/", authenticateToken ,async(req,res)=>{
    const { date, time_from, time_to, size, lot_id } = req.body;
    const client = await pool.connect();

    try{
       
        const result = await findFreeSpots(date, time_from, time_to, size, lot_id);
        
        if (result && result.length > 0)
        {
            await client.query("BEGIN");
            const spots = await client.query("SELECT * FROM parking_spots WHERE row_id = ($1)",[result[0].parking_spots_row_id]);

            const lots = await client.query("SELECT * FROM parking_lots WHERE row_id = ($1)",[spots.rows[0].parking_lot_row_id]);
            if(lots.rows.length == 0) 
                throw "Error in getting Parking Lot information";

            //amount= ((number of minutes)/30)*rate 
            let noOfSlots = (Date.parse(`${date}T${time_to}`) - Date.parse(`${date}T${time_from}`))/(1000*60*30);
            let amount = 0.0;
            if (size === "small" )
                amount = lots.rows[0].small_spot_rate * noOfSlots;
            else if (size === "medium")
                amount = lots.rows[0].medium_spot_rate * noOfSlots;
            else if (size === "large")
                amount = lots.rows[0].large_spot_rate * noOfSlots;    
            else
                throw "Invalid size for parking spot!";
            
            //insert record into booking and get the booking_id
            const booking = await client.query("INSERT INTO bookings(user_id, booking_date, time_from, time_to, total_amount, parking_spots_spot_id) \
            VALUES($1, $2, $3, $4, $5, $6) RETURNING *", [req.user.user,date, time_from, time_to, amount, spots.rows[0].spot_id] );

            // update the parking slots table with booking id and mark the is_booked flag to true for respective records
            await client.query("UPDATE parking_slots SET is_booked = true, booking_id = ($1) WHERE parking_spots_row_id = ($2) AND date = ($3) \
            AND time_from >= ($4) AND time_to <= ($5)",[booking.rows[0].booking_id, result[0].parking_spots_row_id, date, time_from, time_to ]);
            
            await client.query("COMMIT");
            res.json(booking.rows[0]);
        }
        else
         res.status(404).json({ error: "No free slot found!" });
        
    }
    catch(error){
        await client.query("ROLLBACK");
        res.status(500).json({ error: error.message });
    }
    finally{
        client.release();
    }
});

// -----------------------------------------------------------------------
// GET - Get Booking(s) based on Query Parameters
// /api/bookings?user_id="TESTER"
// -----------------------------------------------------------------------
router.get("/", authenticateToken, async(req,res)=>{
    try{
    let result = await pool.query("SELECT * FROM bookings WHERE user_id = ($1)",[req.query.user_id]);

    res.json(result.rows);
    }
    catch(error){
        res.status(500).json({ error: error.message });
    }
});
export default router;