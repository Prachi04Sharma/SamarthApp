import express from 'express';
import { auth } from '../middleware/auth.js';
import { eyeMovementController } from '../controllers/eyeMovementController.js';
import { facialSymmetryController } from '../controllers/facialSymmetryController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Eye Movement Assessment Routes
router.post('/eye-movement', eyeMovementController.save);

// Facial Symmetry Assessment Routes
router.post('/facial-symmetry', facialSymmetryController.save);
router.get('/facial-symmetry/history/:userId', facialSymmetryController.getHistory);
router.get('/facial-symmetry/baseline/:userId', facialSymmetryController.getBaseline);

export default router;
