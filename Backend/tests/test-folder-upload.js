import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

// Test Cloudinary upload with explicit folder
const testCloudinaryFolder = async () => {
  try {
    console.log('🧪 Testing Cloudinary folder upload...');
    
    const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dp40k7aee/image/upload';
    const UPLOAD_PRESET = 'valley_steel_inspections';
    
    // Create a small test image data (1x1 pixel PNG)
    const testImageData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    
    const formData = new FormData();
    
    // Add the test image
    formData.append('file', testImageData, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    
    // Add upload preset
    formData.append('upload_preset', UPLOAD_PRESET);
    
    // Force folder path
    formData.append('folder', 'valley-steel-inspections');
    
    // Add public_id with folder prefix
    const timestamp = Date.now();
    formData.append('public_id', `valley-steel-inspections/test_upload_${timestamp}`);
    
    console.log('📤 Uploading test image to valley-steel-inspections folder...');
    
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Upload successful!');
    console.log('📍 Final URL:', data.secure_url);
    console.log('📁 Public ID:', data.public_id);
    console.log('🗂️ Folder in URL:', data.public_id.includes('valley-steel-inspections') ? '✅ CORRECT FOLDER' : '❌ WRONG FOLDER');
    
    // Check if the URL contains the folder name
    if (data.public_id.includes('valley-steel-inspections')) {
      console.log('🎉 SUCCESS: Photo was uploaded to the correct folder!');
    } else {
      console.log('⚠️ WARNING: Photo was not uploaded to the expected folder');
      console.log('Expected: valley-steel-inspections');
      console.log('Actual folder in public_id:', data.public_id.split('/')[0]);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testCloudinaryFolder();
