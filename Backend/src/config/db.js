import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function initDB() {
    try {
        console.log('🔄 Initializing database...');
        
        // Create users table for admin roles
        await sql`CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        console.log('✅ Users table created/verified');

        // 🔧 RESTORE YOUR ADMIN ACCESS - MULTIPLE ATTEMPTS
        const yourClerkUserId = "user_30yBMfBIYMUv07iT9jOhhVqsfxN";
        const yourEmail = "baldemarguajardo20@gmail.com";
        
        console.log('🔑 Setting up admin user...');
        console.log('Clerk ID:', yourClerkUserId);
        console.log('Email:', yourEmail);
        
        // Method 1: Delete and recreate (most reliable)
        try {
            await sql`DELETE FROM users WHERE email = ${yourEmail}`;
            await sql`DELETE FROM users WHERE id = ${yourClerkUserId}`;
            console.log('🗑️ Cleared existing records');
        } catch (deleteError) {
            console.log('ℹ️ No existing records to delete');
        }
        
        // Method 2: Insert fresh admin record
        try {
            await sql`INSERT INTO users (id, email, role) 
                      VALUES (${yourClerkUserId}, ${yourEmail}, 'admin')`;
            console.log('✅ Created admin user successfully');
        } catch (insertError) {
            console.log('⚠️ Insert failed, trying upsert...');
            
            // Method 3: Upsert as fallback
            await sql`INSERT INTO users (id, email, role) 
                      VALUES (${yourClerkUserId}, ${yourEmail}, 'admin')
                      ON CONFLICT (id) DO UPDATE SET 
                      email = EXCLUDED.email, 
                      role = 'admin'`;
            console.log('✅ Upserted admin user');
        }
        
        // Method 4: Force update any existing record
        await sql`UPDATE users SET role = 'admin' 
                  WHERE email = ${yourEmail} OR id = ${yourClerkUserId}`;
        
        // Verify admin was created
        const adminVerification = await sql`
            SELECT id, email, role FROM users 
            WHERE email = ${yourEmail} OR id = ${yourClerkUserId}
        `;
        
        const adminUsers = adminVerification.rows || adminVerification;
        console.log('🔍 Admin verification results:', adminUsers);
        
        if (adminUsers.length > 0) {
            console.log('✅ Admin user confirmed:', adminUsers[0]);
        } else {
            console.error('❌ ADMIN USER NOT FOUND AFTER SETUP!');
        }

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

        console.log("✅ Database initialized successfully.");
        
    } catch (error) {
        console.error("❌ Error initializing database:", error);
        
        // 🚨 EMERGENCY ADMIN RESTORE
        try {
            console.log('🚨 Emergency admin restore...');
            
            const yourEmail = "baldemarguajardo20@gmail.com";
            const yourClerkUserId = "user_30yBMfBIYMUv07iT9jOhhVqsfxN";
            
            // Try multiple recovery methods
            await sql`UPDATE users SET role = 'admin' WHERE email ILIKE ${yourEmail}`;
            await sql`UPDATE users SET role = 'admin' WHERE id = ${yourClerkUserId}`;
            
            // Insert if nothing exists
            await sql`INSERT INTO users (id, email, role) 
                      VALUES (${yourClerkUserId}, ${yourEmail}, 'admin')
                      ON CONFLICT DO NOTHING`;
            
            console.log('🆘 Emergency admin restore completed');
            
        } catch (emergencyError) {
            console.error('💥 Emergency restore failed:', emergencyError);
        }
    }
}

export { sql, initDB };