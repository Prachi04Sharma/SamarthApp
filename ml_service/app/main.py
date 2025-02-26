from fastapi import FastAPI, UploadFile, HTTPException, Form, File
from fastapi.middleware.cors import CORSMiddleware
import logging
import asyncio
import numpy as np
import cv2
import mediapipe as mp
import io

from .models.face_analysis import FaceAnalyzer
from .models.eye_tracking import EyeTracker
from .models.tremor_analysis import TremorAnalyzer
from .models.neck_mobility import NeckMobilityAnalyzer
from .utils.image_processing import read_image_file
from .utils.video_processing import save_video_to_temp, extract_frames

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzers
face_analyzer = FaceAnalyzer()
eye_tracker = EyeTracker()
tremor_analyzer = TremorAnalyzer()
neck_mobility_analyzer = NeckMobilityAnalyzer()

@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ML Service is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.post("/analyze/face")
async def analyze_face(file: UploadFile):
    """Analyze facial symmetry."""
    try:
        logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
        
        # Read file contents
        contents = await file.read()
        logger.info(f"File size: {len(contents)} bytes")
        
        # Convert to OpenCV format
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            logger.error("Failed to decode image")
            raise HTTPException(status_code=400, detail="Invalid image format")
            
        logger.info(f"Image shape: {image.shape}")
        
        # Process image
        results = face_analyzer.analyze_symmetry(image)
        logger.info(f"Analysis results: {results}")
        
        if not results["success"]:
            return {
                "success": False,
                "error": results.get("error", "Face analysis failed")
            }
            
        return results
        
    except Exception as e:
        logger.error(f"Error analyzing face: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/eyes")
async def analyze_eyes(file: UploadFile):
    """Analyze eye movement."""
    try:
        contents = await file.read()
        image = read_image_file(contents)
        
        results = eye_tracker.analyze_eye_movement(image)
        return results
    except Exception as e:
        logger.error(f"Error analyzing eyes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/tremor")
async def analyze_tremor(file: UploadFile):
    """Analyze hand tremor from video."""
    try:
        contents = await file.read()
        video_path = save_video_to_temp(contents)
        frames = extract_frames(video_path)
        
        if not frames:
            return {"success": False, "error": "No frames could be extracted from video"}
        
        # Process each frame
        for frame in frames:
            hand_landmarks = tremor_analyzer.process_frame(frame)
            tremor_analyzer.add_frame_data(hand_landmarks)
        
        # Analyze the collected data
        results = tremor_analyzer.analyze_tremor()
        return results
    except Exception as e:
        logger.error(f"Error analyzing tremor: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/neck/set-neutral")
async def set_neutral_position(frame: UploadFile = File(...)):
    try:
        contents = await frame.read()
        landmarks, viz_frame = neck_mobility_analyzer.process_frame(contents)
        
        if landmarks is None:
            return {"success": False, "error": "No pose detected"}
            
        success = neck_mobility_analyzer.set_neutral_position(landmarks)
        
        return {
            "success": success,
            "message": "Neutral position set successfully" if success else "Failed to set neutral position"
        }
    except Exception as e:
        print(f"Error setting neutral position: {str(e)}")
        return {"success": False, "error": str(e)}

@app.post("/analyze/neck/measure")
async def measure_position(
    frame: UploadFile = File(...),
    position: str = Form(...)
):
    try:
        contents = await frame.read()
        landmarks, viz_frame = neck_mobility_analyzer.process_frame(contents)
        
        if landmarks is None:
            return {"success": False, "error": "No pose detected"}
            
        # Measure the position based on the type
        if position == "flexion":
            angle = neck_mobility_analyzer.measure_flexion(landmarks)
        elif position == "extension":
            angle = neck_mobility_analyzer.measure_extension(landmarks)
        elif position == "rotation":
            angle = neck_mobility_analyzer.measure_rotation(landmarks)
        else:
            return {"success": False, "error": "Invalid position type"}
            
        return {
            "success": True,
            "angle": angle
        }
    except Exception as e:
        print(f"Error measuring position: {str(e)}")
        return {"success": False, "error": str(e)}

@app.get("/analyze/neck/results")
async def get_results():
    try:
        results = neck_mobility_analyzer.get_mobility_assessment()
        return results
    except Exception as e:
        print(f"Error getting results: {str(e)}")
        return {"success": False, "error": str(e)}