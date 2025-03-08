# SAMARTH App: Neurological Assessment Platform

## Overview
SAMARTH is a comprehensive neurological assessment web platform designed to monitor and evaluate symptoms of various neurological conditions including Bell's Palsy, Amyotrophic Lateral Sclerosis (ALS), and Parkinson's Disease. The platform utilizes computer vision, machine learning, signal processing techniques, and AI analysis to assess neuromotor function through various specialized tests.

## Tech Stack

### Frontend
- **Framework**: React.js 19.x with Vite
- **UI Library**: Material UI 5.x with Emotion styling
- **State Management**: React Context API (AuthContext)
- **Routing**: React Router 6.x
- **Data Visualization**: Chart.js with React-Chartjs-2
- **HTTP Client**: Axios
- **PDF Export**: jsPDF with jspdf-autotable
- **Animation**: Framer Motion
- **PWA Support**: Vite PWA Plugin

### Backend
- **Server**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **AI Integration**: Google Generative AI API (Gemini 2.0)
- **File Handling**: Multer
- **PDF Generation**: PDFKit

### Machine Learning
- **Core Libraries**: TensorFlow.js
- **Vision Models**:
  - Face landmarks detection
  - Hand pose detection
  - Pose detection
- **Backend Processing**: 
  - Python with FastAPI
  - OpenCV
  - MediaPipe
  - NumPy, SciPy
  - Librosa for audio processing

### DevOps
- **Version Control**: Git
- **Linting**: ESLint
- **Bundling**: Vite
- **Development Server**: Nodemon (backend)

## Features

### 1. Facial Symmetry Analysis
- Detects facial landmarks using MediaPipe Face Mesh
- Calculates symmetry metrics for eyes, mouth, jawline, and eyebrows
- Assesses neurological indicators for conditions like Bell's Palsy

### 2. Eye Movement Assessment
- Tracks eye movement velocity and patterns
- Measures Eye Aspect Ratio (EAR) to detect blinks
- Identifies saccades, fixations, and abnormal eye movements like nystagmus

### 3. Speech Pattern Analysis
- Analyzes voice recordings for pitch variations, rhythm, and tonal quality
- Detects monotonic speech patterns
- Identifies neurological speech impairments

### 4. Tremor Assessment
- Tracks hand movements to detect tremor frequency and amplitude
- Uses Fast Fourier Transform (FFT) for frequency analysis
- Classifies tremor types (resting, postural, action/intention)

### 5. Finger Tapping Test
- Measures speed, rhythm, and accuracy of alternating finger taps
- Analyzes motor neuron efficiency and fine motor control
- Provides metrics related to bradykinesia and coordination

### 6. Gait Analysis
- Evaluates walking patterns and stability
- Measures stride length, cadence, and symmetry
- Detects abnormalities indicative of neurological conditions

### 7. AI-Powered Analysis
- Comprehensive analysis of assessment results
- Trend identification across multiple assessments
- Personalized recommendations based on assessment history

## Screenshots

Below are snapshots from the SAMARTH App:

### Dashboard
![Dashboard](./docs/screenshots/dashboard.png)
*Main dashboard showing available assessments, recent activities, and user statistics*

### Facial Symmetry Assessment
![Facial Symmetry](./docs/screenshots/facial-symmetry.png)
*Real-time facial landmark detection and symmetry analysis*

### Eye Movement Analysis
![Eye Movement](./docs/screenshots/eye-movement.png)
*Eye tracking visualization showing movement patterns and metrics*

### Tremor Analysis
![Tremor Analysis](./docs/screenshots/tremor.png)
*Hand tremor frequency and amplitude visualization with FFT analysis*

### Analytics Dashboard
![Analytics](./docs/screenshots/analytics.png)
*Comprehensive visualization of assessment results and progress over time*

### Assessment Report
![Report](./docs/screenshots/report.png)
*Sample assessment report with AI-powered insights*

## Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/samarth-web.git
   cd samarth-web
   ```
   
2. Install frontend dependencies:
   ```sh
   npm install
   ```
   
3. Install backend dependencies:
   ```sh
   cd backend
   npm install
   ```

4. Install ML service dependencies (if using the Python service):
   ```sh
   cd ml_service
   pip install -r requirements.txt
   ```

5. Set up environment variables:
   - Create `.env` file in the backend directory
   - Required variables include `MONGODB_URI`, `JWT_SECRET`, `PORT`
   - For the frontend, create `.env` with `VITE_API_URL`

6. Run the application:
   ```sh
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from root directory)
   npm run dev
   ```

## Usage
- Register an account or log in with existing credentials
- Complete various neurological assessments from the dashboard
- View historical assessment results and track progress over time
- Get AI-powered analysis and insights on the Analytics page
- Export assessment reports as PDFs for medical professionals

## Deployment
The application can be deployed using various methods:
- Frontend: Vercel, Netlify, or similar static hosting
- Backend: Render, Railway, Heroku, or any Node.js hosting service
- Database: MongoDB Atlas for cloud-hosted database

## Contributions
Contributions are welcome! Please submit a pull request or open an issue to suggest improvements.

## License
This project is licensed under the MIT License.

## Acknowledgments
- Research from URMC Rochester, Stanford Medicine, JAMA, and other sources
- TensorFlow.js, MediaPipe, OpenCV, and Librosa for providing powerful tools for analysis
- Google's Gemini API for AI-powered assessment analysis

---
*Developed by INSTANT IDEATORS*