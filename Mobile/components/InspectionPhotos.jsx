import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Modal, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/colors';
import { useTranslation } from '../hooks/useTranslation';
import { uploadImageToCloudinary } from '../services/cloudinaryService';
import { API_URL } from '../constants/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const InspectionPhotos = ({ photos = [], onPhotosChange, editable = false, vehicleInfo = null }) => {
    const { t } = useTranslation();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [imageRetryCount, setImageRetryCount] = useState({});
    
    const displayPhotos = photos || [];

    const handleAddPhoto = async () => {
        if (!editable) {
            Alert.alert(t('error'), 'Cannot add photos in view mode');
            return;
        }

        try {
            // Show options for camera or gallery
            Alert.alert(
                t('addPhoto'),
                t('chooseImageSource'),
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('camera'), onPress: () => takePhoto('camera') },
                    { text: t('gallery'), onPress: () => takePhoto('gallery') },
                ]
            );
        } catch (error) {
            Alert.alert(t('error'), error.message || t('failedToTakePhoto'));
        }
    };

    const takePhoto = async (source) => {
        try {
            setIsUploading(true);

            // Request permissions
            const { status } = source === 'camera' 
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    t('error'),
                    source === 'camera' ? t('cameraPermissionRequired') : t('galleryPermissionRequired')
                );
                return;
            }

            // Launch camera or gallery
            const options = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8, // Compress to reduce upload time
            };

            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);

            if (!result.canceled && result.assets && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                
                // Upload to Cloudinary immediately with vehicle information
                console.log('📸 Starting Cloudinary upload process...');
                console.log('📸 Image URI:', imageUri);
                console.log('🚗 Vehicle info for upload:', vehicleInfo);
                
                try {
                    const cloudinaryResult = await uploadImageToCloudinary(imageUri, vehicleInfo);
                    console.log('📸 Cloudinary result received:', cloudinaryResult);
                    console.log('🚗 Vehicle organization details:', {
                        vehicle: cloudinaryResult.vehicle,
                        folder: cloudinaryResult.vehicleFolder,
                        fileName: cloudinaryResult.fileName
                    });
                    
                    // Create photo object with Cloudinary URL and vehicle organization
                    const newPhoto = {
                        id: Date.now(),
                        cloudinary_url: cloudinaryResult.url,
                        cloudinary_public_id: cloudinaryResult.publicId,
                        name: cloudinaryResult.fileName,
                        width: cloudinaryResult.width,
                        height: cloudinaryResult.height,
                        fileSize: cloudinaryResult.fileSize,
                        localUri: imageUri, // Keep local URI as backup
                        uploaded_at: new Date().toISOString(),
                        // Add vehicle organization metadata
                        vehicle: cloudinaryResult.vehicle,
                        vehicleFolder: cloudinaryResult.vehicleFolder,
                        context: cloudinaryResult.context,
                    };

                    console.log('📸 New photo object created:', newPhoto);

                    // Add to photos array
                    const newPhotos = [newPhoto, ...displayPhotos];
                    if (onPhotosChange) {
                        onPhotosChange(newPhotos);
                    }

                    console.log('✅ Photo uploaded successfully to Cloudinary:', cloudinaryResult.url);
                    Alert.alert(t('success'), t('photoUploadedSuccess'));
                } catch (cloudinaryError) {
                    console.error('❌ Cloudinary upload failed:', cloudinaryError);
                    
                    // Fallback: save with local URI only
                    const fallbackPhoto = {
                        id: Date.now(),
                        uri: imageUri,
                        name: `temp_photo_${Date.now()}.jpg`,
                        width: result.assets[0].width,
                        height: result.assets[0].height,
                        fileSize: result.assets[0].fileSize,
                    };

                    const newPhotos = [fallbackPhoto, ...displayPhotos];
                    if (onPhotosChange) {
                        onPhotosChange(newPhotos);
                    }

                    Alert.alert(t('error'), `Cloudinary upload failed: ${cloudinaryError.message}`);
                }
            }
        } catch (error) {
            console.error('❌ Photo upload error:', error);
            Alert.alert(t('error'), error.message || t('failedToUploadPhoto'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeletePhoto = (photoIndex) => {
        if (!editable) return;
        
        Alert.alert(
            t('removePhoto'),
            t('removePhotoConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('remove'),
                    style: 'destructive',
                    onPress: () => {
                        const newPhotos = displayPhotos.filter((_, index) => index !== photoIndex);
                        if (onPhotosChange) {
                            onPhotosChange(newPhotos);
                        }
                    }
                }
            ]
        );
    };

    const handlePhotoPress = (photo) => {
        console.log('🔒 Opening photo viewer for:', photo.name);
        setSelectedPhoto(photo);
        setShowPhotoModal(true);
    };

    const closePhotoModal = () => {
        console.log('🔒 Closing photo viewer');
        setShowPhotoModal(false);
        setSelectedPhoto(null);
    };

    const getPhotoDisplayUrl = (photo) => {
        console.log('🔍 Getting photo display URL for:', photo);
        if (photo?.cloudinary_url) {
            console.log('✅ Using cloudinary_url:', photo.cloudinary_url);
            return photo.cloudinary_url;
        }
        if (photo?.google_drive_url) {
            console.log('✅ Using google_drive_url:', photo.google_drive_url);
            return photo.google_drive_url;
        }
        if (photo?.uri) {
            console.log('✅ Using uri:', photo.uri);
            return photo.uri;
        }
        if (photo?.localUri) {
            console.log('✅ Using localUri:', photo.localUri);
            return photo.localUri;
        }
        console.log('❌ No valid URL found for photo:', photo);
        return null;
    };

    // Simple image component without complex retry logic
    const SimpleImage = ({ photo, style, isModal = false }) => {
        const [hasError, setHasError] = useState(false);
        const [isLoading, setIsLoading] = useState(false);
        
        const imageUrl = getPhotoDisplayUrl(photo);

        const handleImageError = (error) => {
            console.log(`❌ Image load failed for ${photo?.name}:`, error);
            setHasError(true);
            setIsLoading(false);
        };

        const handleImageLoad = () => {
            console.log(`✅ Image loaded successfully: ${photo?.name}`);
            setHasError(false);
            setIsLoading(false);
        };

        const handleLoadStart = () => {
            console.log(`🔄 Starting to load image: ${photo?.name}`);
            setIsLoading(true);
            setHasError(false);
        };

        if (hasError) {
            return (
                <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }]}>
                    <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
                    <Text style={{ color: COLORS.textLight, fontSize: 12, marginTop: 4 }}>
                        {t('imageNotAvailable')}
                    </Text>
                    <TouchableOpacity 
                        style={{ marginTop: 8, padding: 4 }}
                        onPress={() => {
                            console.log('🔄 Retrying image load');
                            setHasError(false);
                            setIsLoading(false);
                        }}
                    >
                        <Text style={{ color: COLORS.primary, fontSize: 12 }}>
                            {t('retry')} 🔄
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!imageUrl) {
            return (
                <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }]}>
                    <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
                    <Text style={{ color: COLORS.textLight, fontSize: 12, marginTop: 4 }}>
                        {t('noImageUrl')}
                    </Text>
                </View>
            );
        }

        return (
            <View style={style}>
                {isLoading && (
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                )}
                <Image 
                    source={{ uri: imageUrl }}
                    style={style}
                    resizeMode={isModal ? "contain" : "cover"}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    onLoadStart={handleLoadStart}
                />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.title}>{t('photos')}</Text>
                </View>
                {editable && (
                    <TouchableOpacity 
                        style={[styles.addButton, isUploading && styles.addButtonDisabled]} 
                        onPress={handleAddPhoto}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Ionicons 
                                name="add-circle-outline" 
                                size={20} 
                                color={COLORS.primary} 
                            />
                        )}
                        <Text style={styles.addButtonText}>
                            {isUploading ? t('uploading') : t('addPhoto')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {!Array.isArray(displayPhotos) || displayPhotos.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="camera-outline" size={48} color={COLORS.textLight} />
                    <Text style={styles.emptyText}>
                        {t('noPhotosAdded')}
                    </Text>
                    {editable && (
                        <Text style={styles.emptySubtext}>
                            {t('tapAddPhotoToStart')}
                        </Text>
                    )}
                    {!editable && (
                        <Text style={styles.emptySubtext}>
                            {t('photosWillAppearAfterSaving')}
                        </Text>
                    )}
                </View>
            ) : (
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.photosContainer}
                    contentContainerStyle={styles.photosContent}
                >
                    {Array.isArray(displayPhotos) && displayPhotos.map((image, index) => {
                        const photoUrl = getPhotoDisplayUrl(image);
                        return (
                            <View key={image?.id || image?.name || index} style={styles.photoCard}>
                                <TouchableOpacity 
                                    style={styles.photoTouchable}
                                    onPress={() => handlePhotoPress(image)}
                                    activeOpacity={0.8}
                                >
                                    {photoUrl ? (
                                        <SimpleImage 
                                            photo={image}
                                            style={styles.photo}
                                        />
                                    ) : (
                                        <View style={styles.photoPlaceholder}>
                                            <Ionicons name="image-outline" size={32} color={COLORS.textLight} />
                                        </View>
                                    )}
                                    
                                    {/* Photo overlay with zoom icon */}
                                    <View style={styles.photoOverlay}>
                                        <Ionicons name="expand-outline" size={20} color={COLORS.white} />
                                    </View>
                                </TouchableOpacity>
                                
                                <View style={styles.photoInfo}>
                                    <Text style={styles.photoName} numberOfLines={1}>
                                        {image?.file_name || image?.name || t('unnamedPhoto')}
                                    </Text>
                                    <Text style={styles.photoDate}>
                                        {image?.uploaded_at ? 
                                            new Date(image.uploaded_at).toLocaleDateString() : 
                                            t('recentPhoto')
                                        }
                                    </Text>
                                </View>
                                {editable && (
                                    <TouchableOpacity 
                                        style={styles.deleteButton}
                                        onPress={() => handleDeletePhoto(index)}
                                    >
                                        <Ionicons name="trash" size={16} color={COLORS.danger} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            {isUploading && (
                <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.uploadingText}>{t('uploading')}</Text>
                </View>
            )}

            {/* Photo Modal Viewer */}
            <Modal
                visible={showPhotoModal}
                transparent={true}
                animationType="fade"
                onRequestClose={closePhotoModal}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity 
                        style={styles.modalBackdrop}
                        onPress={closePhotoModal}
                        activeOpacity={1}
                    >
                        <View style={styles.modalContent}>
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {selectedPhoto?.file_name || selectedPhoto?.name || t('photo')}
                                </Text>
                                <TouchableOpacity 
                                    style={styles.modalCloseButton}
                                    onPress={closePhotoModal}
                                >
                                    <Ionicons name="close" size={24} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>

                            {/* Photo Display */}
                            <View style={styles.modalPhotoContainer}>
                                {selectedPhoto ? (
                                    <SimpleImage 
                                        photo={selectedPhoto}
                                        style={styles.modalPhoto}
                                        isModal={true}
                                    />
                                ) : (
                                    <View style={styles.modalPhotoPlaceholder}>
                                        <Ionicons name="image-outline" size={64} color={COLORS.textLight} />
                                        <Text style={styles.modalPlaceholderText}>
                                            {t('imageNotAvailable')}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Photo Info */}
                            {selectedPhoto && (
                                <View style={styles.modalPhotoInfo}>
                                    <Text style={styles.modalPhotoDate}>
                                        {selectedPhoto.uploaded_at ? 
                                            new Date(selectedPhoto.uploaded_at).toLocaleString() : 
                                            t('uploadDateUnknown')
                                        }
                                    </Text>
                                    {selectedPhoto.fileSize && (
                                        <Text style={styles.modalPhotoSize}>
                                            {t('fileSize')}: {(selectedPhoto.fileSize / 1024 / 1024).toFixed(2)} MB
                                        </Text>
                                    )}
                                    {selectedPhoto.width && selectedPhoto.height && (
                                        <Text style={styles.modalPhotoDimensions}>
                                            {t('dimensions')}: {selectedPhoto.width} × {selectedPhoto.height}
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = {
    container: {
        marginVertical: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginLeft: 8,
        color: COLORS.textLight,
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    addButtonText: {
        color: COLORS.primary,
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 4,
        textAlign: 'center',
    },
    photosContainer: {
        flexDirection: 'row',
    },
    photosContent: {
        paddingRight: 16,
    },
    photoCard: {
        width: 200,
        marginRight: 12,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    photoTouchable: {
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: 150,
        backgroundColor: COLORS.background,
    },
    photoOverlay: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholder: {
        width: '100%',
        height: 150,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoInfo: {
        padding: 12,
    },
    photoName: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 4,
    },
    photoDate: {
        fontSize: 11,
        color: COLORS.textLight,
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    uploadingText: {
        marginTop: 8,
        color: COLORS.text,
        fontSize: 14,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        paddingTop: 50, // Account for status bar
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalTitle: {
        color: COLORS.white,
        fontSize: 18,
        fontWeight: '500',
        flex: 1,
        marginRight: 16,
    },
    modalCloseButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalPhotoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoScrollView: {
        flex: 1,
        width: screenWidth,
        height: screenHeight * 0.7,
    },
    photoScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalPhoto: {
        width: screenWidth,
        height: screenHeight * 0.7,
        maxWidth: screenWidth,
        maxHeight: screenHeight * 0.7,
    },
    modalPhotoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        width: screenWidth,
        height: screenHeight * 0.5,
    },
    modalPlaceholderText: {
        color: COLORS.white,
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    modalPhotoInfo: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    modalPhotoDate: {
        color: COLORS.white,
        fontSize: 14,
        marginBottom: 4,
    },
    modalPhotoSize: {
        color: COLORS.white,
        fontSize: 12,
        opacity: 0.8,
        marginBottom: 2,
    },
    modalPhotoDimensions: {
        color: COLORS.white,
        fontSize: 12,
        opacity: 0.8,
    },
};

export default InspectionPhotos;
