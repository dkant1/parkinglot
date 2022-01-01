"use strict";
import express from "express";
import pool from "../db.js";
import format from "pg-format";
import { authenticateToken } from "../middleware/authorization.js";

const router = express.Router();

// -----------------------------------------------------------------------
//GET ALL - Get all the Prking Lot records
// -----------------------------------------------------------------------
router.get("/", authenticateToken, async (req, res) => {
  try {
    const list = await pool.query("SELECT * FROM parking_lots");
    res.json(list.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------
//GET - Get a Parking Lot based on ID passed as url parameter
// -----------------------------------------------------------------------
router.get("/:id", authenticateToken, async (req, res) => {
  let lotid = req.params.id;
  try {
    const list = await pool.query("SELECT * FROM parking_lots WHERE lot_id = $1", [lotid]);
    res.json(list.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------------------------------------------------
// PUT - Update a Parking Lot record.
// On Update of a Lot, recreate Parking Spots for the Lot. TODO - Handle Parking Slots deletion on deletion of Spots
// -----------------------------------------------------------------------
router.put("/:id", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updRow = await client.query(
      "UPDATE parking_lots SET \
      location = ($1), small_spots_no = ($2), medium_spots_no = ($3), large_spots_no = ($4), \
      small_spot_rate = ($5), medium_spot_rate = ($6), large_spot_rate= ($7) \
      WHERE lot_id = ($8) RETURNING row_id" ,
      [
        req.body.location,
        req.body.small_spots_no,
        req.body.medium_spots_no,
        req.body.large_spots_no,
        req.body.small_spot_rate,
        req.body.medium_spot_rate,
        req.body.large_spot_rate,
        req.body.lot_id,
      ]
    );
    console.log("Rows Updated parking_lots : " + updRow.rowCount);

    const delRows = await client.query("DELETE FROM parking_spots WHERE parking_lot_row_id = ($1)", [updRow.rows[0].row_id]);
    console.log("Rows Delete from parking_spots : " + delRows.rowCount);

    createParkingSpots(client, req.body, updRow.rows[0].row_id );

    await client.query("COMMIT");
    res.send("Row ID of Lot record updated : " + updRow.rows[0].row_id);

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });

  } finally {
    client.release();
  }
});

//-----------------------------------------------------------------------
// DELETE - Delete a Parking lot along with Parking Spots (TODO - Delete Parking Slots also if there is not a single booking on a Date for the Spot)
// -----------------------------------------------------------------------
router.delete("/:id", authenticateToken, async (req, res) => {
  let lotid = req.params.id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    //first delete the dependent parking_spots for the lot
    let result = await client.query("DELETE FROM parking_spots WHERE parking_lot_row_id = (SELECT row_id from parking_lots WHERE \
      lot_id = ($1))", [lotid]);
    console.log("Parking Spot records deleted : " + result.rowCount );
    
    //then delete the parking lot
    result = await client.query("DELETE FROM parking_lots WHERE lot_id = $1 RETURNING *", [lotid]);
    console.log("Parking Lot Record deleted with Row ID : " + result.rows[0].row_id);

    await client.query("COMMIT");
    res.json("Record Deleted with RowID : " + result.rows[0].row_id);

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });

  } finally {
    client.release();
  }


});
// -----------------------------------------------------------------------
//POST - Create Parking Lot record along with Parking Spots
// -----------------------------------------------------------------------

router.post("/", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const newLot = await client.query(
      "INSERT INTO parking_lots \
      (lot_id, location, small_spots_no, medium_spots_no, large_spots_no, small_spot_rate, medium_spot_rate, large_spot_rate) \
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ) RETURNING *",
      [
        req.body.lot_id,
        req.body.location,
        req.body.small_spots_no,
        req.body.medium_spots_no,
        req.body.large_spots_no,
        req.body.small_spot_rate,
        req.body.medium_spot_rate,
        req.body.large_spot_rate,
      ]
    );
  // Automatically create parking spots in the background when a parking lot is created
    createParkingSpots(client, req.body, newLot.rows[0].row_id );

    await client.query("COMMIT");
    res.json( newLot.rows[0] );

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: error.message });

  } finally {
    client.release();
  }
});

//--------------------------------------------------------------------------
// Helper function to create Parking Spots
// -------------------------------------------------------------------------
async function createParkingSpots(client, data, lot_row_id){
  let records = [];
  let totalSpots = data.small_spots_no + data.medium_spots_no + data.large_spots_no;

  for (let i = 1; i <= totalSpots; i++) {
    let record = [];
    record.push(data.lot_id + "-" + i.toString().padStart(3, "0"));

    let size;
    if (i <= data.small_spots_no) 
      size = "small";
    else if (i > data.small_spots_no && i <= data.small_spots_no + data.medium_spots_no) 
      size = "medium";
    else 
      size = "large";
    record.push(size);
    record.push(lot_row_id);

    records.push(record);
  }
  try{
  const result = await client.query( format("INSERT INTO parking_spots (spot_id, size, parking_lot_row_id) values %L RETURNING *", records));
  
  console.log("Parking Spots Created : " + result.rows.length);

  }
  catch(error){
    throw error;
  }
}

export default router;
