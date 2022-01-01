import pg from 'pg';
import dotenv from "dotenv";

const { Pool } = pg;
dotenv.config();


let poolConfig = { };

console.log("---> NODE_ENV : " + process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
    poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    }
else{
    poolConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME 
    }
}

const pool = new Pool(poolConfig);
export default pool;