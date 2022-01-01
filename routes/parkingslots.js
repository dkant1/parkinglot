"use strict";
import express from "express";
import pool from "../db.js";
import format from "pg-format";
import { findFreeSpots } from "../utils/utils.js";
import { authenticateToken } from "../middleware/authorization.js";

const router = express.Router();

// -----------------------------------------------------------------------
//POST - Generate slots for a Parking Spot and a Date. Slots will be created from 9:00AM to 20:00PM
// req.body = {
//      "date" : "2021-12-28",
//      "spotid" : "JY01-009"
// }
// -----------------------------------------------------------------------

router.post("/", authenticateToken, async(req,res)=>{
    let date = req.body.date;
    
    try {
        //get the parking spot row id from spotID field to fill the foreign key
        let results = await pool.query("SELECT row_id FROM parking_spots WHERE spot_id = ($1)",[req.body.spotid]);
        let spotRowID = results.rows[0].row_id;


        //generate slots for the provided date and parking spot id between 7am to 10pm
        let records = [];      

        if (req.body.date !== null){
            
            for (let i = 9; i < 21; i++) {
                for (let j = 0; j <= 30; j += 30) {
                    let rec = [];
                    rec.push(req.body.date);
                    rec.push(`${i}:${j}`);
                    rec.push( j === 0 ? `${i}:30` : `${i + 1}:00`);
                    rec.push(false);
                    rec.push(spotRowID)

                    records.push(rec);
                }
            }        
        }
      
        results = await pool.query(format("INSERT INTO parking_slots(date, time_from, time_to, is_booked, parking_spots_row_id) VALUES %L", records));
                
        res.json("Slots generated in parking_slots table : " + results.rowCount);

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
});

// -----------------------------------------------------------------------
// GET - Get Slots based on Query Parameters
// /api/parkingslots?date=2021-12-28&lot_id=JY01&size=small&time_from=09:30&time_to=11:00
// -----------------------------------------------------------------------
router.get("/", authenticateToken,async(req,res)=>{

    try{
       const result =  await findFreeSpots(req.query.date, req.query.time_from, req.query.time_to, req.query.size, req.query.lot_id );
       res.json(result);
    }   
    catch(error){
        res.status(500).json({ error: error.message });
    }   
});

export default router;