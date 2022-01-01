

DROP TABLE IF EXISTS public.parking_lots CASCADE;

CREATE TABLE public.parking_lots (
	row_id serial NOT NULL PRIMARY KEY,
	lot_id varchar(6) UNIQUE NOT NULL,
	location varchar(60) NOT NULL,
	small_spots_no int4 NOT NULL DEFAULT 0,
	medium_spots_no int4 NOT NULL DEFAULT 0,
	large_spots_no int4 NOT NULL DEFAULT 0,
	small_spot_rate numeric(5, 2) NOT NULL DEFAULT 0,
	medium_spot_rate numeric(5, 2) NOT NULL DEFAULT 0,
	large_spot_rate numeric(5, 2) NOT NULL DEFAULT 0
);

INSERT INTO public.parking_lots
(lot_id, "location", small_spots_no, medium_spots_no, large_spots_no, small_spot_rate, medium_spot_rate, large_spot_rate)
VALUES ('W01', 'Whitefield', 38, 22, 15, 25.99, 30.98, 40.50 );

DROP TYPE IF EXISTS parking_space_sizes;
CREATE TYPE parking_space_sizes AS ENUM ('small', 'medium', 'large');

DROP TABLE IF EXISTS public.parking_spots CASCADE;

CREATE TABLE IF NOT EXISTS public.parking_spots (
	row_id  SERIAL NOT NULL PRIMARY KEY,
	spot_id VARCHAR(20) UNIQUE NOT NULL,    
  	size    parking_space_sizes NOT NULL,
  	parking_lot_row_id INT NOT NULL,
  	FOREIGN KEY(parking_lot_row_id) REFERENCES parking_lots(row_id)

);
INSERT INTO public.parking_spots (spot_id, parking_lot_id,size) VALUES ('W01-001', 'W001', 'small' );


DROP TABLE IF EXISTS public.parking_slots CASCADE;

CREATE TABLE public.parking_slots (
	row_id      serial NOT NULL PRIMARY KEY,	
	"date" 		DATE NOT NULL,
	time_from 	TIME NOT NULL,
	time_to 	TIME NOT NULL,
	booking_id 	UUID NULL,
	is_booked 	BOOL NOT NULL,
	parking_spots_row_id INTEGER NOT NULL,
	CONSTRAINT parking_slots_date_time_from_key UNIQUE ("date", time_from, parking_spots_row_id),
	FOREIGN KEY(parking_spots_row_id) REFERENCES parking_spots(row_id)
);

DROP TABLE IF EXISTS public.bookings;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.bookings (
  row_id 		SERIAL NOT NULL PRIMARY KEY,
  booking_id 	UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  user_id 		VARCHAR(10) NOT NULL,  
  booking_date 	DATE NOT NULL,
  time_from 	TIME NOT NULL,
  time_to 		TIME NOT NULL,
  total_amount 	NUMERIC (6,2),
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  modified_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  parking_spots_spot_id VARCHAR(20) NOT NULL,
  FOREIGN KEY(parking_spots_spot_id) REFERENCES parking_spots(spot_id)
);

DROP TABLE IF EXISTS public.users;

CREATE TABLE public.users(
  row_id 		SERIAL NOT NULL PRIMARY KEY,
  email			VARCHAR(60) NOT NULL UNIQUE, 
  passcode      VARCHAR(100) NOT NULL,
  mobile		VARCHAR(10) NOT NULL UNIQUE,
  refresh_token VARCHAR(256) NULL
);
