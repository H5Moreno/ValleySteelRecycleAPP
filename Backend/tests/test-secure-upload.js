// Test photo upload to Cloudinary (privacy configured via upload preset)
import 'dotenv/config';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

if (!CLOUDINARY_CLOUD_NAME || !UPLOAD_PRESET) {
  console.error('❌ Missing Cloudinary environment variables');
  process.exit(1);
}

async function testSecureUpload() {
  try {
    console.log('🔒 Testing SECURE photo upload...');
    console.log('🔒 Using environment variables for security');
    
    // Create a simple test image data (base64 encoded 1x1 pixel)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const formData = new FormData();
    
    // Add the test image
    formData.append('file', testImageData);
    
    // Add upload preset (from environment)
    formData.append('upload_preset', UPLOAD_PRESET);
    
    // Force folder path
    formData.append('folder', 'valley-steel-inspections');
    
    // Add public_id with folder prefix
    const timestamp = Date.now();
    formData.append('public_id', `valley-steel-inspections/test_secure_photo_${timestamp}`);
    
    // Add tags
    formData.append('tags', 'test,vehicle-inspection,mobile-app,private');
    
    console.log('📸 Upload configuration:');
    console.log('   Security: Using environment variables');
    console.log('   Folder: valley-steel-inspections');
    console.log('   Privacy: Configured in upload preset');
    
    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ SECURE upload successful!');
    console.log('🔗 URL contains /private/:', data.secure_url.includes('/private/'));
    console.log('🔒 Type:', data.type);
    console.log('🔐 Access Mode:', data.access_mode || 'Not set');
    console.log('📁 Correct folder:', data.public_id.includes('valley-steel-inspections/'));
    
    // Security check
    if (data.secure_url.includes('/private/')) {
      console.log('✅ Photos are PRIVATE and SECURE!');
    } else {
      console.log('⚠️ Photos might be public - check upload preset configuration');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSecureUpload();
