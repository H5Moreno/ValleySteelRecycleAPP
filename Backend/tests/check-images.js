import { sql } from '@vercel/postgres';
import 'dotenv/config';

async function checkImages() {
    try {
        console.log('🔍 Checking images in database...');
        
        // Get all images from database
        const images = await sql`
            SELECT 
                id,
                inspection_id,
                file_name,
                cloudinary_url,
                cloudinary_public_id,
                google_drive_url,
                image_uri,
                created_at
            FROM inspection_images 
            ORDER BY created_at DESC
            LIMIT 20
        `;
        
        const imageList = images.rows || images;
        
        if (imageList.length === 0) {
            console.log('❌ No images found in database');
            return;
        }
        
        console.log(`✅ Found ${imageList.length} images:`);
        console.log('');
        
        imageList.forEach((img, index) => {
            console.log(`📸 Image ${index + 1}:`);
            console.log(`   ID: ${img.id}`);
            console.log(`   Inspection ID: ${img.inspection_id}`);
            console.log(`   File Name: ${img.file_name || 'N/A'}`);
            console.log(`   Cloudinary URL: ${img.cloudinary_url || 'N/A'}`);
            console.log(`   Cloudinary Public ID: ${img.cloudinary_public_id || 'N/A'}`);
            console.log(`   Google Drive URL: ${img.google_drive_url || 'N/A'}`);
            console.log(`   Local URI: ${img.image_uri || 'N/A'}`);
            console.log(`   Created: ${img.created_at}`);
            console.log('   ---');
        });
        
        // Count by storage type
        const cloudinaryCount = imageList.filter(img => img.cloudinary_url).length;
        const driveCount = imageList.filter(img => img.google_drive_url).length;
        const localCount = imageList.filter(img => img.image_uri && !img.cloudinary_url && !img.google_drive_url).length;
        
        console.log('\n📊 Storage Summary:');
        console.log(`   Cloudinary: ${cloudinaryCount} images`);
        console.log(`   Google Drive: ${driveCount} images`);
        console.log(`   Local only: ${localCount} images`);
        
    } catch (error) {
        console.error('❌ Error checking images:', error);
    }
}

checkImages();
