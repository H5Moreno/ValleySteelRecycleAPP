import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../constants/api';

export const useImageUpload = () => {
    const [isUploading, setIsUploading] = useState(false);

    // New simplified upload method for create screen
    const uploadImage = async (inspectionId, imageUri, userId) => {
        try {
            setIsUploading(true);
            console.log(`📸 Uploading image for inspection ${inspectionId}...`);

            const formData = new FormData();
            
            // Create file object
            const uriParts = imageUri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            formData.append('image', {
                uri: imageUri,
                name: `photo.${fileType}`,
                type: `image/${fileType}`,
            });
            
            formData.append('imageType', 'defect_photo');
            if (userId) {
                formData.append('userId', userId);
            }

            const response = await fetch(`${API_URL}/inspections/${inspectionId}/images`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Image uploaded successfully:', result.image.file_name);
                return result;
            } else {
                console.error('❌ Upload failed:', result.error);
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('❌ Network error during upload:', error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    // Legacy method with picker - kept for compatibility
    const uploadImageWithPicker = async (inspectionId, imageType = 'defect_photo', userId) => {
        return new Promise((resolve, reject) => {
            Alert.alert(
                'Add Photo',
                'Choose how you want to add the photo',
                [
                    { text: 'Camera', onPress: () => openCamera(inspectionId, imageType, userId, resolve, reject) },
                    { text: 'Gallery', onPress: () => openGallery(inspectionId, imageType, userId, resolve, reject) },
                    { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Cancelled')) }
                ]
            );
        });
    };

    const openCamera = async (inspectionId, imageType, userId, resolve, reject) => {
        try {
            // Request camera permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required to take photos');
                reject(new Error('Camera permission denied'));
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadToServer(result.assets[0], inspectionId, imageType, userId, resolve, reject);
            } else {
                reject(new Error('No image captured'));
            }
        } catch (error) {
            reject(error);
        }
    };

    const openGallery = async (inspectionId, imageType, userId, resolve, reject) => {
        try {
            // Request media library permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Gallery permission is required to select photos');
                reject(new Error('Gallery permission denied'));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadToServer(result.assets[0], inspectionId, imageType, userId, resolve, reject);
            } else {
                reject(new Error('No image selected'));
            }
        } catch (error) {
            reject(error);
        }
    };

    const uploadToServer = async (asset, inspectionId, imageType, userId, resolve, reject) => {
        try {
            setIsUploading(true);
            console.log(`📸 Uploading image for inspection ${inspectionId}...`);

            const formData = new FormData();
            
            // Create file object
            const uriParts = asset.uri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            formData.append('image', {
                uri: asset.uri,
                name: `photo.${fileType}`,
                type: `image/${fileType}`,
            });
            
            formData.append('imageType', imageType);
            formData.append('userId', userId);

            const response = await fetch(`${API_URL}/inspections/${inspectionId}/images`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Image uploaded successfully:', result.image.file_name);
                resolve(result);
            } else {
                console.error('❌ Upload failed:', result.error);
                reject(new Error(result.error || 'Upload failed'));
            }
        } catch (error) {
            console.error('❌ Network error during upload:', error);
            reject(error);
        } finally {
            setIsUploading(false);
        }
    };

    const getInspectionImages = async (inspectionId) => {
        try {
            console.log(`📸 Fetching images for inspection ${inspectionId}`);
            const response = await fetch(`${API_URL}/inspections/${inspectionId}/images`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📸 Raw images response:', result);
            
            // Handle both possible response formats
            const images = result.images || result || [];
            console.log('📸 Processed images:', images);
            
            // Ensure we always return an array
            return Array.isArray(images) ? images : [];
        } catch (error) {
            console.error('❌ Error fetching images:', error);
            // Return empty array instead of throwing to prevent crashes
            return [];
        }
    };

    const deleteImage = async (imageId, userId) => {
        try {
            const response = await fetch(`${API_URL}/images/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const result = await response.json();

            if (response.ok) {
                return result;
            } else {
                throw new Error(result.error || 'Failed to delete image');
            }
        } catch (error) {
            console.error('❌ Error deleting image:', error);
            throw error;
        }
    };

    return { 
        uploadImage, 
        uploadImageWithPicker,
        isUploading, 
        getInspectionImages, 
        deleteImage 
    };
};
