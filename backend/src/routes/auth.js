import express from 'express';
import { UserController } from '../controllers/userController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const userController = new UserController();

// Public routes
router.post('/register', userController.register.bind(userController));
router.post('/login', userController.login.bind(userController));

// Protected routes
router.get('/me', auth, userController.getCurrentUser.bind(userController));

export default router; 