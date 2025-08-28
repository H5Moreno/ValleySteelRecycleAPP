import { sql } from '../config/db.js';
import { generateSecurePhotoUrl, validatePhotoAccess } from '../services/photoService.js';
import { v4 as uuidv4 } from 'uuid';

// Upload image for inspection
export async function uploadInspectionImage(req, res) {
    try {
        const { inspectionId } = req.params;
        const { imageType = 'defect_photo', userId } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`📸 Uploading image for inspection ${inspectionId}, type: ${imageType}`);

        // Validate inspection exists
        const inspection = await sql`
            SELECT id FROM vehicle_inspections WHERE id = ${inspectionId}
        `;
        
        if (inspection.length === 0) {
            return res.status(404).json({ error: 'Inspection not found' });
        }

        // Generate unique filename
        const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
        const uniqueFileName = `inspection_${inspectionId}_${imageType}_${Date.now()}_${uuidv4()}.${fileExtension}`;

        // Upload to Google Drive
        const driveResult = await googleDriveService.uploadFile(
            req.file.buffer,
            uniqueFileName,
            req.file.mimetype
        );

        // Save to database
        const imageRecord = await sql`
            INSERT INTO inspection_images (
                inspection_id,
                google_drive_file_id,
                google_drive_url,
                file_name,
                file_size,
                mime_type,
                image_type,
                uploaded_by
            ) VALUES (
                ${inspectionId},
                ${driveResult.fileId},
                ${driveResult.directLink},
                ${driveResult.fileName},
                ${driveResult.fileSize || 0},
                ${driveResult.mimeType},
                ${imageType},
                ${userId}
            )
            RETURNING *
        `;

        console.log(`✅ Image uploaded successfully for inspection ${inspectionId}`);

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            image: imageRecord[0],
            driveInfo: {
                fileId: driveResult.fileId,
                directLink: driveResult.directLink,
                webViewLink: driveResult.webViewLink
            }
        });

    } catch (error) {
        console.error('❌ Error uploading inspection image:', error);
        res.status(500).json({ 
            error: 'Failed to upload image',
            details: error.message 
        });
    }
}

// Get images for inspection
export async function getInspectionImages(req, res) {
    try {
        const { inspectionId } = req.params;

        const images = await sql`
            SELECT 
                id,
                google_drive_file_id,
                google_drive_url,
                file_name,
                file_size,
                mime_type,
                image_type,
                uploaded_at,
                uploaded_by
            FROM inspection_images 
            WHERE inspection_id = ${inspectionId}
            ORDER BY uploaded_at DESC
        `;

        res.json({
            success: true,
            images: images
        });

    } catch (error) {
        console.error('❌ Error fetching inspection images:', error);
        res.status(500).json({ 
            error: 'Failed to fetch images',
            details: error.message 
        });
    }
}

// Delete image
export async function deleteInspectionImage(req, res) {
    try {
        const { imageId } = req.params;
        const { userId } = req.body;

        // Get image info
        const image = await sql`
            SELECT google_drive_file_id, inspection_id
            FROM inspection_images 
            WHERE id = ${imageId}
        `;

        if (image.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete from Google Drive
        await googleDriveService.deleteFile(image[0].google_drive_file_id);

        // Delete from database
        await sql`
            DELETE FROM inspection_images 
            WHERE id = ${imageId}
        `;

        console.log(`🗑️ Image deleted: ${imageId}`);

        res.json({ 
            success: true, 
            message: 'Image deleted successfully' 
        });

    } catch (error) {
        console.error('❌ Error deleting inspection image:', error);
        res.status(500).json({ 
            error: 'Failed to delete image',
            details: error.message 
        });
    }
}

// Get fresh URL for private photo (handles expiration)
export async function getFreshPhotoUrl(req, res) {
    try {
        const { photoId } = req.params;
        const { userId } = req.query;

        console.log(`🔒 Getting fresh URL for photo ${photoId}, user: ${userId}`);

        // Get photo details from database
        const photos = await sql`
            SELECT 
                id,
                cloudinary_public_id,
                cloudinary_url,
                google_drive_url,
                file_name,
                is_private,
                inspection_id
            FROM inspection_images 
            WHERE id = ${photoId}
        `;

        if (photos.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const photo = photos[0];

        // Validate user has access to this photo
        const hasAccess = await validatePhotoAccess(photo.cloudinary_public_id, userId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        let freshUrl = null;

        // Handle different photo types
        if (photo.cloudinary_public_id && photo.is_private) {
            // Generate fresh URL for private Cloudinary photo
            freshUrl = generateSecurePhotoUrl(photo.cloudinary_public_id, {
                width: 1200,
                height: 900,
                crop: 'fit',
                quality: 'auto'
            });
        } else if (photo.cloudinary_url) {
            // Use existing Cloudinary URL with cache buster
            const separator = photo.cloudinary_url.includes('?') ? '&' : '?';
            freshUrl = `${photo.cloudinary_url}${separator}cb=${Date.now()}`;
        } else if (photo.google_drive_url) {
            // Use Google Drive URL
            freshUrl = photo.google_drive_url;
        }

        if (!freshUrl) {
            return res.status(404).json({ error: 'Photo URL not available' });
        }

        console.log(`✅ Fresh URL generated for photo ${photoId}`);

        res.json({
            success: true,
            photoId: photo.id,
            freshUrl: freshUrl,
            fileName: photo.file_name,
            isPrivate: photo.is_private,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        });

    } catch (error) {
        console.error('❌ Error generating fresh photo URL:', error);
        res.status(500).json({ 
            error: 'Failed to generate fresh photo URL',
            details: error.message 
        });
    }
}
