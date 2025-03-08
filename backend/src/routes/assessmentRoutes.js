import express from 'express';
import {
  getAllAssessments,
  getAssessmentsByType,
  generatePdfReport,
  getAiAnalysis,
  getAssessmentHistory,
  saveAssessment,
  deleteAssessment,
  addAssessment,
  getBaselineData
} from '../controllers/assessmentController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes with auth middleware
router.use(auth);

// Routes
router.get('/history', getAssessmentHistory);
router.get('/baseline', getBaselineData); // Add explicit route for baseline
router.post('/', saveAssessment);
router.delete('/:id', deleteAssessment);
router.post('/add', addAssessment);

// Special report and AI routes
router.get('/:userId/report', generatePdfReport);
router.post('/:userId/ai-analysis', getAiAnalysis);

// These need to come after the specific routes to avoid conflicts
router.get('/:userId/:type', getAssessmentsByType);
router.get('/:userId', getAllAssessments);

export default router;
