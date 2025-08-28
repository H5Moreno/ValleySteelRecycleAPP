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
            vehicle_id VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            date_time TIMESTAMP,
            speedometer_reading VARCHAR(50),
            trailer_number VARCHAR(255),
            condition_satisfactory BOOLEAN DEFAULT true,
            defective_items TEXT[],
            truck_trailer_defects TEXT[],
            defects_corrected BOOLEAN DEFAULT false,
            defects_need_correction BOOLEAN DEFAULT false,
            remarks TEXT,
            driver_signature TEXT,
            mechanic_signature TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        console.log('✅ Vehicle inspections table created/verified.');

        // Create inspection_images table for Google Drive integration
        await sql`CREATE TABLE IF NOT EXISTS inspection_images (
            id SERIAL PRIMARY KEY,
            inspection_id INTEGER REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
            google_drive_file_id VARCHAR(255) NOT NULL,
            google_drive_url VARCHAR(500) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            file_size INTEGER,
            mime_type VARCHAR(100),
            image_type VARCHAR(50) DEFAULT 'general',
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            uploaded_by VARCHAR(255)
        )`;
        console.log('✅ Inspection images table created/verified.');

        // Add indexes for better performance
        await sql`CREATE INDEX IF NOT EXISTS idx_inspection_images_inspection_id ON inspection_images(inspection_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_inspection_images_type ON inspection_images(image_type)`;
        console.log('✅ Image table indexes created/verified.');
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