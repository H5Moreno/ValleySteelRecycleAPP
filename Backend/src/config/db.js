import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function initDB() {
    try {
        console.log('Initializing database...');
        
        // Create users table for admin roles
        await sql`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        // Update your existing account to admin
        const yourClerkUserId = "user_30yBMfBIYMUv07iT9jOhhVqsfxN";
        const yourEmail = "baldemarguajardo20@gmail.com";
        
        // Check if user exists by email first
        const existingUser = await sql`SELECT id, email, role FROM users WHERE email = ${yourEmail}`;
        
        if (existingUser.rows && existingUser.rows.length > 0) {
            // User exists with this email, update their role to admin
            await sql`UPDATE users SET role = 'admin' WHERE email = ${yourEmail}`;
            console.log(`Updated existing user ${yourEmail} to admin role.`);
        } else {
            // User doesn't exist, create new admin user
            await sql`INSERT INTO users (id, email, role) 
                      VALUES (${yourClerkUserId}, ${yourEmail}, 'admin')`;
            console.log(`Created new admin user ${yourEmail}.`);
        }

        // Also handle the case where the Clerk ID might be different
        // Update the user ID if needed
        await sql`UPDATE users SET id = ${yourClerkUserId} WHERE email = ${yourEmail} AND id != ${yourClerkUserId}`;

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

        console.log("Database initialized successfully.");
    } catch (error) {
        console.error("Error initializing database:", error);
        process.exit(1);
    }
}

export { sql, initDB };