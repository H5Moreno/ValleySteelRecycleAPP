// Test photo upload to Cloudinary (privacy configured via upload preset)
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dp40k7aee/image/upload';
const UPLOAD_PRESET = 'valley_steel_inspections';

async function testUpload() {
  try {
    console.log('🔒 Testing photo upload with privacy via upload preset...');
    
    // Create a simple test image data (base64 encoded 1x1 pixel)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const formData = new FormData();
    
    // Add the test image
    formData.append('file', testImageData);
    
    // Add upload preset
    formData.append('upload_preset', UPLOAD_PRESET);
    
    // Force folder path
    formData.append('folder', 'valley-steel-inspections');
    
    // Add public_id with folder prefix
    const timestamp = Date.now();
    formData.append('public_id', `valley-steel-inspections/test_photo_${timestamp}`);
    
    // Add tags
    formData.append('tags', 'test,vehicle-inspection,mobile-app,private');
    
    console.log('� Upload configuration:');
    console.log('   Preset:', UPLOAD_PRESET);
    console.log('   Folder: valley-steel-inspections');
    console.log('   Note: Privacy must be configured in upload preset');
    
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
    
    console.log('✅ Upload successful!');
    console.log('� URL:', data.secure_url);
    console.log('🆔 Public ID:', data.public_id);
    console.log('� Folder:', data.folder);
    console.log('🏷️ Tags:', data.tags);
    console.log('🔒 Type:', data.type || 'Not set (configure in upload preset)');
    console.log('� Access Mode:', data.access_mode || 'Not set (configure in upload preset)');
    
    // Check if photo went to correct folder
    if (data.public_id && data.public_id.includes('valley-steel-inspections/')) {
      console.log('✅ Photo correctly saved to valley-steel-inspections folder');
    } else {
      console.log('⚠️ Photo might not be in the correct folder');
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUpload();
