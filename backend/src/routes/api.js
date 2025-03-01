import express from 'express';
import { eyeMovementController } from '../controllers/eyeMovementController.js';
import { neckMobilityController } from '../controllers/neckMobilityController.js';
// ...existing imports...

const router = express.Router();

// ...existing routes...

// Eye Movement routes
router.post('/specialized-assessments/eye-movement', eyeMovementController.save);
router.get('/specialized-assessments/eye-movement/history', eyeMovementController.getHistory);
router.get('/specialized-assessments/eye-movement/baseline/:userId', eyeMovementController.getBaseline);

// Neck Mobility routes
router.post('/specialized-assessments/neck-mobility', neckMobilityController.save);
router.get('/specialized-assessments/neck-mobility/history', neckMobilityController.getHistory);
router.get('/specialized-assessments/neck-mobility/baseline/:userId', neckMobilityController.getBaseline);

// ...other routes...

export default router;
