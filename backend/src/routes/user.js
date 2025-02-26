import express from 'express';
import { auth } from '../middleware/auth.js';
import { UserController } from '../controllers/userController.js';

const router = express.Router();
const userController = new UserController();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.get('/assessments', auth, userController.getAssessments);

export default router; 