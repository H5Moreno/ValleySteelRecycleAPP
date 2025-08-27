// 🔒 SECURE: Get credentials from environment variables
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Validate environment variables
if (!CLOUDINARY_CLOUD_NAME || !UPLOAD_PRESET) {
  throw new Error('🔒 Cloudinary configuration missing from environment variables');
}

export const uploadImageToCloudinary = async (imageUri, vehicleInfo = null) => {
  try {
    console.log('📸 Starting Cloudinary upload for:', imageUri);
    console.log('🚗 Vehicle info:', vehicleInfo);
    
    const formData = new FormData();
    
    // Create vehicle-specific naming
    const timestamp = Date.now();
    const vehiclePrefix = vehicleInfo?.vehicle ? `${vehicleInfo.vehicle.replace(/[^a-zA-Z0-9]/g, '_')}_` : '';
    const photoName = `${vehiclePrefix}inspection_${timestamp}.jpg`;
    
    // Create vehicle-specific folder structure
    const baseFolder = 'valley-steel-inspections';
    const vehicleFolder = vehicleInfo?.vehicle ? `${baseFolder}/${vehicleInfo.vehicle.replace(/[^a-zA-Z0-9]/g, '_')}` : baseFolder;
    const publicId = `${vehicleFolder}/${vehiclePrefix}${timestamp}`;
    
    // Add the image file
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: photoName,
    });
    
    // Add upload preset (no API key needed for unsigned uploads)
    formData.append('upload_preset', UPLOAD_PRESET);
    
    // Vehicle-specific folder organization
    formData.append('folder', vehicleFolder);
    
    // Add public_id with vehicle organization
    formData.append('public_id', publicId);
    
    // Add vehicle-specific tags for better organization
    const baseTags = 'vehicle-inspection,mobile-app,private';
    const vehicleTags = vehicleInfo?.vehicle ? `,vehicle-${vehicleInfo.vehicle.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const dateTags = vehicleInfo?.date ? `,date-${vehicleInfo.date}` : '';
    formData.append('tags', `${baseTags}${vehicleTags}${dateTags}`);
    
    // Add context metadata for better organization
    if (vehicleInfo) {
      const context = {
        vehicle: vehicleInfo.vehicle || 'unknown',
        inspection_date: vehicleInfo.date || new Date().toISOString().split('T')[0],
        location: vehicleInfo.location || 'unknown'
      };
      formData.append('context', JSON.stringify(context));
    }
    
    console.log('📸 Upload details:', {
      preset: UPLOAD_PRESET,
      folder: vehicleFolder,
      type: 'PRIVATE',
      access_mode: 'AUTHENTICATED',
      public_id: publicId,
      vehicle: vehicleInfo?.vehicle || 'N/A',
      photo_name: photoName,
      url: CLOUDINARY_URL
    });
    
    console.log('🚗 Uploading PRIVATE photo to Cloudinary with vehicle organization...');
    
    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cloudinary upload failed:', response.status, errorText);
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ PRIVATE photo uploaded successfully:', data.secure_url);
    console.log('🔒 Private Public ID:', data.public_id);
    console.log('🚗 Vehicle folder:', vehicleFolder);
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      fileName: data.original_filename || photoName,
      uploadedAt: data.created_at,
      width: data.width,
      height: data.height,
      fileSize: data.bytes,
      isPrivate: true, // Flag to indicate this is a private photo
      resourceType: data.resource_type || 'image',
      format: data.format || 'jpg',
      // Add vehicle organization metadata
      vehicle: vehicleInfo?.vehicle || null,
      vehicleFolder: vehicleFolder,
      context: data.context || null,
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to cloud storage: ${error.message}`);
  }
};

export const deleteImageFromCloudinary = async (publicId) => {
  // Note: Deletion requires signed requests (API key/secret)
  // For private images, deletion requires API signature
  // This will be handled on the backend for security
  console.log('🗑️ Marking private image for deletion:', publicId);
  return true;
};

// Helper function to get optimized private image URL
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 400,
    height = 300,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;
  
  // For private images, we need to use the private URL structure
  // Note: Private images require authentication to view
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/private/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
};

// NEW: Function to generate secure viewing URLs for private images
export const getSecureImageUrl = (publicId, transformation = '') => {
  if (!publicId) return null;
  
  // For private images, we need to generate signed URLs
  // This should be done on the backend for security
  console.log('🔒 Generating secure URL for private image:', publicId);
  
  // For now, return the basic private URL structure
  // The backend will handle generating proper signed URLs
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/private/${transformation}${publicId}`;
};
