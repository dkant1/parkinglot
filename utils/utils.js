"use strict";
import pool from "../db.js";

export async function findFreeSpots(date, time_from, time_to, size, lot_id){

    let query = "SELECT parking_spots_row_id, is_booked FROM parking_slots WHERE date = ($1) AND time_from >= ($2) AND time_to <= ($3)  AND \
                parking_spots_row_id IN ( \
                SELECT row_id FROM parking_spots WHERE size = ($4) AND parking_lot_row_id = ( \
                    SELECT row_id FROM parking_lots WHERE lot_id = ($5)))\
                    GROUP BY parking_spots_row_id, is_booked";
    try{                
        let result = await pool.query(query,[date, time_from, time_to, size, lot_id]);
        //Query will return spot_row_ids grouped by is_booked. This means if a spot has at least one booking in the selected time frame then two rows will be
        // returned. If a slot is either booked is fully free in selected time frame then only one row will be returned per spot_row_id

        console.log("All Slots :" + JSON.stringify(result.rows));

        let bookedEntriesArray = result.rows.filter((obj)=>{
            return obj.is_booked; //if is_booked is TRUE then return this entry
        }).map(a => a.parking_spots_row_id); //create array of only spot_row_ids. Array will have distinct spot_row_ids which have booking. No duplicates

        console.log("Booked Slots :" + JSON.stringify(bookedEntriesArray));
        
        // Remove all the spot_row_ids which appear in above bookedEntries array, since these cannot be booked 
        let availableSlots = result.rows.filter((item) =>{             
            if(bookedEntriesArray.indexOf(item.parking_spots_row_id) !== -1){ //spot id found in booked ones, filter it 
                return false;
            }else
                return true; 
        });

        console.log("Available Slots :" + JSON.stringify(availableSlots));         
        return availableSlots;
    }
    catch(error) {
        throw error;
      }
}




