// Backend service to handle private Cloudinary photo URLs
import 'dotenv/config';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

export const generateSecurePhotoUrl = (publicId, options = {}) => {
  try {
    if (!publicId || !CLOUDINARY_CLOUD_NAME) {
      throw new Error('Missing public ID or cloud name');
    }

    const {
      width = 800,
      height = 600,
      crop = 'fit',
      quality = 'auto',
      format = 'auto',
    } = options;

    // For private images, construct the URL with transformations
    // Note: This is a basic implementation. For production, you should use
    // Cloudinary's SDK to generate properly signed URLs
    const transformation = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
    
    // Add cache busting parameter
    const cacheBuster = `cb_${Date.now()}`;
    
    // Construct private URL
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/private`;
    const fullUrl = `${baseUrl}/${transformation},${cacheBuster}/${publicId}`;
    
    console.log('🔒 Generated secure photo URL for:', publicId);
    return fullUrl;
    
  } catch (error) {
    console.error('❌ Error generating secure photo URL:', error);
    throw error;
  }
};

export const validatePhotoAccess = async (publicId, userId) => {
  try {
    // Add logic to validate if user has access to this photo
    // For now, we'll return true, but you can add inspection ownership checks
    console.log('🔒 Validating photo access for user:', userId, 'photo:', publicId);
    return true;
  } catch (error) {
    console.error('❌ Error validating photo access:', error);
    return false;
  }
};
