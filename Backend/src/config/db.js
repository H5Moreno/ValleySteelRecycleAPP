import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function initDB() {
    try {
        console.log('🔄 Initializing database...');
        
        // Create users table for roles - THIS IS ALL THIS FILE SHOULD DO
        await sql`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        console.log('✅ Users table created/verified.');

        // Create vehicle_inspections table
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_by VARCHAR(255)
        )`;
        console.log('✅ Vehicle inspections table created/verified.');

        console.log("✅ Database initialized successfully.");
        
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        // Exit if the database can't be set up, as the app is unusable.
        process.exit(1);
    }
}

export { sql, initDB };