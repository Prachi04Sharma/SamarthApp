import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import specializedAssessmentRoutes from './routes/specialized-assessments.js';
import authRoutes from './routes/auth.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';
import { requestLogger } from './middleware/requestLogger.js';

// Initialize environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://samarth-app.vercel.app', 'http://localhost:5173'], // Fix CORS issue
  credentials: true
}));

// Request logger middleware
app.use(requestLogger);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route - moved above 404 middleware to prevent "GET /" 404 errors
app.get("/", (req, res) => {
  res.send("Server is running.");
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/specialized-assessments', specializedAssessmentRoutes);
app.use('/api', diagnosticRoutes);

// 404 Middleware (Handles unknown routes)
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/samarth") // Added fallback for local dev
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

export default app;
