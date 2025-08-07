// import {neon} from "@neondatabase/serverless";

// import"dotenv/config";

// // Creates a SQL connection using our DB Url
// export const sql = neon(process.env.DATABASE_URL)

// export async function initDB() {
//     try {
//         await sql`CREATE TABLE IF NOT EXISTS transactions (
//             id SERIAL PRIMARY KEY,
//             user_id VARCHAR(255) NOT NULL,
//             title VARCHAR(255) NOT NULL,
//             amount DECIMAL(10, 2) NOT NULL,
//             category VARCHAR(255) NOT NULL,
//             created_at DATE NOT NULL DEFAULT CURRENT_DATE
//         )`;

//         // DECIMAL(10, 2)
//         // means: a fixed-point number with:
//         // 10 digits total 
//         // 2 digits after the decimal point
//         // so: the max value it can store is 99999999.99

//         console.log("Database initialized successfully.");
//     } catch (error) {
//         console.error("Error initializing database:", error);
//         process.exit(1);
//     }
// }
import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function initDB() {
    try {
        console.log('Initializing database...');
        
        // Drop the old transactions table if it exists
        await sql`DROP TABLE IF EXISTS transactions`;
        
        // Create new vehicle_inspections table
        await sql`CREATE TABLE IF NOT EXISTS vehicle_inspections (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            date DATE NOT NULL DEFAULT CURRENT_DATE,
            time VARCHAR(50),
            vehicle VARCHAR(255),
            speedometer_reading VARCHAR(50),
            defective_items JSONB,
            truck_trailer_items JSONB,
            trailer_number VARCHAR(100),
            remarks TEXT,
            condition_satisfactory BOOLEAN DEFAULT true,
            driver_signature VARCHAR(255),
            defects_corrected BOOLEAN DEFAULT false,
            defects_need_correction BOOLEAN DEFAULT false,
            mechanic_signature VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        console.log("Database initialized successfully.");
    } catch (error) {
        console.error("Error initializing database:", error);
        process.exit(1);
    }
}

export { sql, initDB };