import express from 'express';
import multer from 'multer';
import { 
    uploadInspectionImage, 
    getInspectionImages, 
    deleteInspectionImage,
    getFreshPhotoUrl
} from '../controllers/imageController.js';

const router = express.Router();``

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});

// Routes for inspection images
router.post('/inspections/:inspectionId/images', upload.single('image'), uploadInspectionImage);
router.get('/inspections/:inspectionId/images', getInspectionImages);
router.delete('/images/:imageId', deleteInspectionImage);

// Route to get fresh URL for private photos (handles expiration)
router.get('/photos/:photoId/fresh-url', getFreshPhotoUrl);

export default router;
