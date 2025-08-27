// Test if Cloudinary upload preset exists
const testCloudinaryPreset = async () => {
    const cloudName = 'dp40k7aee';
    const uploadPreset = 'valley_steel_inspections';
    const testUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    console.log('🧪 Testing Cloudinary upload preset...');
    console.log(`🔗 Upload URL: ${testUrl}`);
    console.log(`📋 Preset Name: ${uploadPreset}`);
    console.log('');
    
    try {
        // Create a minimal test upload (will fail but we can see the error)
        const formData = new FormData();
        formData.append('upload_preset', uploadPreset);
        formData.append('file', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'); // 1x1 transparent GIF
        
        const response = await fetch(testUrl, {
            method: 'POST',
            body: formData,
        });
        
        if (response.ok) {
            console.log('✅ Upload preset exists and works!');
            const data = await response.json();
            console.log('📸 Test upload successful:', data.secure_url);
        } else {
            const errorText = await response.text();
            console.log('❌ Upload failed:', response.status);
            console.log('📝 Error details:', errorText);
            
            if (errorText.includes('Invalid upload preset')) {
                console.log('');
                console.log('🚨 SOLUTION: Create upload preset in Cloudinary dashboard');
                console.log('📍 Go to: https://cloudinary.com/console/c-dp40k7aee/settings/upload');
                console.log('📋 Preset name: valley_steel_inspections');
                console.log('🔓 Mode: Unsigned');
            }
        }
    } catch (error) {
        console.log('❌ Network error:', error.message);
    }
};

// Note: This is a Node.js script that simulates what the mobile app does
console.log('📱 This simulates the mobile app upload process');
console.log('🔧 Create the upload preset first, then test in the mobile app');
console.log('');

console.log('📍 Direct link to create preset:');
console.log('https://cloudinary.com/console/c-dp40k7aee/settings/upload');
