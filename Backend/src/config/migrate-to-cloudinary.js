import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function migrateToCloudinary() {
    try {
        console.log('🔄 Starting Cloudinary migration...');
        console.log('📋 Environment check:', {
            hasPostgresUrl: !!process.env.POSTGRES_URL,
            nodeEnv: process.env.NODE_ENV
        });
        
        console.log('🔄 Migrating database to support Cloudinary...');
        
        // Add Cloudinary columns to inspection_images table
        console.log('📝 Adding Cloudinary columns...');
        await sql`
            ALTER TABLE inspection_images 
            ADD COLUMN IF NOT EXISTS cloudinary_url VARCHAR(500),
            ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS width INTEGER,
            ADD COLUMN IF NOT EXISTS height INTEGER,
            ADD COLUMN IF NOT EXISTS image_uri VARCHAR(500),
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `;
        console.log('✅ Added Cloudinary columns to inspection_images table');

        // Make Google Drive columns nullable since we're moving to Cloudinary
        console.log('📝 Making Google Drive columns nullable...');
        await sql`
            ALTER TABLE inspection_images 
            ALTER COLUMN google_drive_file_id DROP NOT NULL,
            ALTER COLUMN google_drive_url DROP NOT NULL
        `;
        console.log('✅ Made Google Drive columns nullable');

        // Add indexes for Cloudinary fields
        console.log('📝 Adding Cloudinary indexes...');
        await sql`CREATE INDEX IF NOT EXISTS idx_inspection_images_cloudinary_public_id ON inspection_images(cloudinary_public_id)`;
        console.log('✅ Added Cloudinary indexes');

        console.log("✅ Database migration to Cloudinary completed successfully!");
        
    } catch (error) {
        console.error("❌ Error migrating database:", error);
        console.error("❌ Error details:", error.message);
        process.exit(1);
    }
}

// Run migration if this file is executed directly
console.log('🚀 Migration script starting...');
migrateToCloudinary();
