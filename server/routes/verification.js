import { Router } from 'express';
import multer from 'multer';
import { extname } from 'path';
// import { verifyClothingImage } from '../services/geminiService.js';
import { verifyClothingImage } from '../services/mockVerificationService.js';
import { auth } from '../middlewares/auth.js';

const router = Router();

// Configure multer for single image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'verify-' + uniqueSuffix + extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Route to verify a single image
router.post('/verify-image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const { description, category } = req.body;
    
    if (!description || !category) {
      return res.status(400).json({ message: 'Description and category are required' });
    }

    console.log('Verification request received:');
    console.log('- File:', req.file.filename);
    console.log('- Description:', description);
    console.log('- Category:', category);

    // Verify the image using Gemini
    const verificationResult = await verifyClothingImage(
      req.file.path,
      description,
      category
    );

    console.log('Verification result:', verificationResult);

    // Clean up the temporary file
    const fs = await import('fs');
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    res.json({
      success: true,
      verification: verificationResult
    });

  } catch (error) {
    console.error('Image verification error:', error);
    res.status(500).json({ 
      message: 'Error verifying image',
      error: error.message 
    });
  }
});

// Route to verify multiple images for an item
router.post('/verify-item', auth, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const { title, description, category } = req.body;
    
    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description and category are required' });
    }

    const verificationResults = [];
    let allImagesMatch = true;
    let averageConfidence = 0;

    // Verify each image
    for (const file of req.files) {
      const result = await verifyClothingImage(file.path, description, category);
      verificationResults.push({
        filename: file.filename,
        ...result
      });

      if (!result.matches) {
        allImagesMatch = false;
      }
      averageConfidence += result.confidence || 0;

      // Clean up the temporary file
      const fs = await import('fs');
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }

    averageConfidence = averageConfidence / verificationResults.length;

    res.json({
      success: true,
      allImagesMatch,
      averageConfidence: Math.round(averageConfidence),
      verificationResults,
      recommendation: allImagesMatch ? 'All images match the description' : 'Some images do not match the description'
    });

  } catch (error) {
    console.error('Item verification error:', error);
    res.status(500).json({ 
      message: 'Error verifying item images',
      error: error.message 
    });
  }
});



export default router; 