import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function addPrivatePhotoFields() {
  try {
    console.log('🔒 Adding private photo fields to database...');
    
    // Add columns for private photo support
    await sql`
      ALTER TABLE inspection_images 
      ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50) DEFAULT 'image',
      ADD COLUMN IF NOT EXISTS format VARCHAR(10) DEFAULT 'jpg'
    `;
    
    console.log('✅ Private photo fields added successfully!');
    console.log('🔒 New fields:');
    console.log('   - is_private: Boolean flag for private photos');
    console.log('   - resource_type: Type of resource (image, video, etc.)');
    console.log('   - format: File format (jpg, png, etc.)');
    
    // Update existing photos to be marked as private if they have cloudinary URLs
    const updateResult = await sql`
      UPDATE inspection_images 
      SET is_private = true 
      WHERE cloudinary_url IS NOT NULL
    `;
    
    console.log(`🔒 Updated ${updateResult.rowCount} existing photos to private status`);
    
  } catch (error) {
    console.error('❌ Error adding private photo fields:', error);
    throw error;
  }
}

addPrivatePhotoFields();
