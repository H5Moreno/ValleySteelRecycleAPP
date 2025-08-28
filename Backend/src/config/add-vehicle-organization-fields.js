import { sql } from './db.js';

async function addVehicleOrganizationFields() {
    try {
        console.log('🚗 Starting migration: Adding vehicle organization fields to inspection_images table...');
        
        // Add vehicle organization columns to inspection_images table
        await sql`
            ALTER TABLE inspection_images 
            ADD COLUMN IF NOT EXISTS vehicle_id VARCHAR(100),
            ADD COLUMN IF NOT EXISTS vehicle_folder VARCHAR(255),
            ADD COLUMN IF NOT EXISTS context_metadata JSONB DEFAULT '{}'::jsonb
        `;
        
        console.log('✅ Added vehicle organization columns to inspection_images table');
        
        // Add indexes for better performance on vehicle queries
        try {
            await sql`
                CREATE INDEX IF NOT EXISTS idx_inspection_images_vehicle_id 
                ON inspection_images(vehicle_id)
            `;
            console.log('✅ Added index on vehicle_id column');
        } catch (indexError) {
            console.log('⚠️ Index may already exist:', indexError.message);
        }
        
        try {
            await sql`
                CREATE INDEX IF NOT EXISTS idx_inspection_images_vehicle_folder 
                ON inspection_images(vehicle_folder)
            `;
            console.log('✅ Added index on vehicle_folder column');
        } catch (indexError) {
            console.log('⚠️ Index may already exist:', indexError.message);
        }
        
        console.log('🎉 Vehicle organization migration completed successfully!');
        console.log('📁 Photos will now be organized by vehicle in Cloudinary folders');
        console.log('🏷️ Photos will be tagged with vehicle information for easy filtering');
        
        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    addVehicleOrganizationFields()
        .then(() => {
            console.log('✅ Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export { addVehicleOrganizationFields };
