from fastapi import FastAPI, UploadFile, HTTPException, Form, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request
import logging
import asyncio
import numpy as np
import cv2
import mediapipe as mp
import io
import tempfile
import os
import uvicorn

from .models.face_analysis import FaceAnalyzer
from .models.eye_tracking import EyeTracker
from .models.tremor_analysis import TremorAnalyzer
from .models.neck_mobility import NeckMobilityAnalyzer
from .utils.image_processing import read_image_file
from .utils.serialization import convert_numpy_types
from .models.speech_pattern import SpeechPatternAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Define CORS settings separately so they can be reused
CORS_ORIGINS = ["http://localhost:5173", "https://samarth-web.vercel.app"]  # Your frontend URLs
CORS_METHODS = ["GET", "POST", "OPTIONS"]
CORS_HEADERS = ["*"]

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Add this custom exception handler for all exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}", exc_info=True)
    
    # Return a proper error response with CORS headers
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "detail": str(exc)
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true"
        }
    )

# Keep your existing HTTP exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "detail": str(exc.detail)
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true"
        }
    )

# Initialize analyzers
face_analyzer = FaceAnalyzer()
eye_tracker = EyeTracker()
tremor_analyzer = TremorAnalyzer()
neck_mobility_analyzer = NeckMobilityAnalyzer()
speech_analyzer = SpeechPatternAnalyzer()

@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ML Service is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "eye_tracking": True,
            "video_processing": True
        }
    }

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

def save_video_to_temp(contents: bytes, extension: str = ".webm") -> str:
    """Save video bytes to a temporary file."""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
            tmp.write(contents)
            return tmp.name
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to save video: {str(e)}")

# Update the extract_frames function

def extract_frames(video_path: str):
    """Extract frames from video file with good density."""
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise HTTPException(status_code=422, detail="Could not open video file")
            
        frames = []
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        logger.info(f"Video properties: {frame_count} frames, {fps} FPS")
        
        # Calculate how many frames to sample to get approximately 10 fps
        # This ensures we have enough frames for analysis without processing every frame
        if frame_count > 0 and fps > 0:
            # Aim for 10-15 fps for analysis (enough for tremor detection)
            target_fps = min(15, fps)
            step = max(1, round(fps / target_fps))
            logger.info(f"Sampling every {step} frame(s) to get ~{fps/step:.1f} fps")
        else:
            step = 1
        
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Only keep every nth frame
            if frame_idx % step == 0:
                frames.append(frame)
                
            frame_idx += 1
            
            # Limit to 300 frames max (10 seconds at 30fps) to prevent memory issues
            if len(frames) >= 300:
                logger.info(f"Reached frame limit (300), stopping extraction")
                break
                
        cap.release()
        
        if not frames:
            logger.warning("No frames extracted from video")
            raise HTTPException(status_code=422, detail="No frames could be extracted from video")
            
        logger.info(f"Successfully extracted {len(frames)} frames")
        return frames
        
    except Exception as e:
        logger.error(f"Error extracting frames: {str(e)}", exc_info=True)
        # Clean up temp file
        try:
            if os.path.exists(video_path):
                os.unlink(video_path)
        except:
            pass
        raise HTTPException(status_code=422, detail=f"Failed to extract frames: {str(e)}")
    
    finally:
        # Clean up temp file
        try:
            if os.path.exists(video_path):
                os.unlink(video_path)
        except:
            pass

@app.post("/analyze/eyes")
async def analyze_eyes(file: UploadFile = File(...), phase: str = Form(...)):
    """Analyze eye movement."""
    try:
        # Read the file content
        contents = await file.read()
        
        # Save to temporary file with appropriate extension
        file_extension = ".webm"  # Default
        if file.filename and file.filename.endswith(".mp4"):
            file_extension = ".mp4"
        
        video_path = save_video_to_temp(contents, file_extension)
        
        # Extract frames from the video file
        frames = extract_frames(video_path)
        
        if not frames:
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "detail": "No frames extracted from video"
                }
            )

        eye_tracker = EyeTracker()
        analysis_results = eye_tracker.analyze_eye_movement_sequence(frames)
        
        # Convert numpy types before returning
        processed_results = convert_numpy_types({
            "success": True,
            "metrics": {
                "summary": analysis_results.get('summary', {}),
                "temporal": analysis_results.get('temporal_metrics', {})
            },
            "neurological_indicators": eye_tracker.analyze_neurological_indicators(
                analysis_results.get('temporal_metrics', {})
            )
        })

        return JSONResponse(content=processed_results)

    except Exception as e:
        logger.error(f"Error analyzing eyes: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "detail": str(e)
            }
        )

@app.options("/analyze/eyes")
async def analyze_eyes_options():
    return JSONResponse(
        status_code=200,
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@app.post("/analyze/tremor")
async def analyze_tremor(file: UploadFile = File(...)):
    """Analyze tremor from video."""
    try:
        # Save the uploaded video to a temporary file
        temp_file = save_video_to_temp(await file.read())
        logger.info(f"Video saved to temporary file: {temp_file}")
        
        # Extract frames from the video
        frames = extract_frames(temp_file)
        logger.info(f"Extracted {len(frames)} frames from video")
        
        # Initialize the tremor analyzer
        analyzer = TremorAnalyzer()
        
        # Process each frame to get hand positions
        hand_positions = []
        for frame in frames:
            position = analyzer.process_frame(frame)
            if position:
                hand_positions.append(position)
                
        logger.info(f"Detected hand in {len(hand_positions)} frames")
        
        # If we have enough frames with hand detections, analyze the tremor
        metrics = analyzer.analyze_tremor(hand_positions)
        logger.info(f"Analysis complete. Metrics: {metrics}")
        
        return {
            "success": True,
            "metrics": metrics
        }
    except Exception as e:
        logger.error(f"Error analyzing tremor: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze tremor: {str(e)}")

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

@app.post("/analyze/speech")
async def analyze_speech(file: UploadFile = File(...)):
    """Analyze speech patterns."""
    temp_path = None
    try:
        logger.info("Starting speech pattern analysis")
        
        # Save audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp:
            temp_path = tmp.name
            contents = await file.read()
            tmp.write(contents)
            tmp.flush()  # Ensure all data is written
        
        # Process audio file
        analysis_results = speech_analyzer.analyze_speech_pattern(temp_path)
        
        if not analysis_results["success"]:
            return JSONResponse(
                status_code=422,
                content={
                    "success": False,
                    "error": analysis_results.get("error", "Speech analysis failed")
                }
            )
        
        # Convert numpy types to Python native types for JSON serialization
        processed_results = convert_numpy_types(analysis_results)
            
        return JSONResponse(content=processed_results)
        
    except Exception as e:
        logger.error(f"Error analyzing speech: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e)
            }
        )
    finally:
        # Clean up temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {str(e)}")

@app.options("/analyze/speech")
async def analyze_speech_options():
    """Handle CORS preflight requests for speech analysis endpoint."""
    return JSONResponse(
        status_code=200,
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Add this at the end of the file to run the app on 0.0.0.0
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)