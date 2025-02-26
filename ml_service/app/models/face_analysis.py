import cv2
import mediapipe as mp
import numpy as np
import logging

logger = logging.getLogger(__name__)

class FaceAnalyzer:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Define landmark indices for different facial features
        self.LEFT_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]
        self.RIGHT_EYE = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382]
        self.MOUTH = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0]
        self.JAWLINE = [162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389]

    def analyze_symmetry(self, image):
        """Analyze facial symmetry using MediaPipe Face Mesh."""
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            height, width = image.shape[:2]
            
            logger.info(f"Processing image of size {width}x{height}")
            
            # Process the image
            results = self.face_mesh.process(rgb_image)
            
            if not results.multi_face_landmarks:
                logger.warning("No face detected in the image")
                return {
                    "success": False,
                    "error": "No face detected"
                }

            landmarks = results.multi_face_landmarks[0].landmark
            
            # Process landmarks
            processed_landmarks = {
                "leftEye": self._process_landmarks(landmarks, self.LEFT_EYE, width, height),
                "rightEye": self._process_landmarks(landmarks, self.RIGHT_EYE, width, height),
                "mouth": self._process_landmarks(landmarks, self.MOUTH, width, height),
                "jawline": self._process_landmarks(landmarks, self.JAWLINE, width, height)
            }
            
            # Calculate symmetry metrics
            eye_symmetry = self._calculate_eye_symmetry(processed_landmarks)
            mouth_symmetry = self._calculate_mouth_symmetry(processed_landmarks)
            jaw_symmetry = self._calculate_jaw_symmetry(processed_landmarks)
            
            # Calculate overall symmetry score (0-100)
            symmetry_score = (eye_symmetry + mouth_symmetry + jaw_symmetry) / 3 * 100
            
            return {
                "success": True,
                "symmetry_score": float(symmetry_score),
                "landmarks": processed_landmarks,
                "metrics": {
                    "eye_symmetry": float(eye_symmetry),
                    "mouth_symmetry": float(mouth_symmetry),
                    "jaw_symmetry": float(jaw_symmetry)
                }
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_symmetry: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": f"Analysis failed: {str(e)}"
            }

    def _process_landmarks(self, landmarks, indices, width, height):
        """Convert landmark indices to x,y coordinates."""
        return [
            {
                "x": int(landmarks[idx].x * width),
                "y": int(landmarks[idx].y * height)
            }
            for idx in indices
        ]

    def _calculate_eye_symmetry(self, landmarks):
        """Calculate eye symmetry score."""
        left_eye = np.array([(p["x"], p["y"]) for p in landmarks["leftEye"]])
        right_eye = np.array([(p["x"], p["y"]) for p in landmarks["rightEye"]])
        
        # Calculate centroids
        left_centroid = np.mean(left_eye, axis=0)
        right_centroid = np.mean(right_eye, axis=0)
        
        # Calculate symmetry based on distance and angle
        dx = abs(left_centroid[0] - right_centroid[0])
        dy = abs(left_centroid[1] - right_centroid[1])
        
        # Normalize by inter-eye distance
        eye_distance = np.linalg.norm(left_centroid - right_centroid)
        symmetry = 1 - (dx + dy) / (2 * eye_distance)
        
        return max(0, min(1, symmetry))

    def _calculate_mouth_symmetry(self, landmarks):
        """Calculate mouth symmetry score."""
        mouth_points = np.array([(p["x"], p["y"]) for p in landmarks["mouth"]])
        centroid = np.mean(mouth_points, axis=0)
        
        # Calculate symmetry based on distances from midline
        left_side = mouth_points[mouth_points[:, 0] < centroid[0]]
        right_side = mouth_points[mouth_points[:, 0] > centroid[0]]
        
        left_dist = np.mean(np.abs(left_side[:, 0] - centroid[0]))
        right_dist = np.mean(np.abs(right_side[:, 0] - centroid[0]))
        
        symmetry = 1 - abs(left_dist - right_dist) / (left_dist + right_dist)
        
        return max(0, min(1, symmetry))

    def _calculate_jaw_symmetry(self, landmarks):
        """Calculate jaw symmetry score."""
        jaw_points = np.array([(p["x"], p["y"]) for p in landmarks["jawline"]])
        centroid = np.mean(jaw_points, axis=0)
        
        # Calculate symmetry based on distances from midline
        left_side = jaw_points[jaw_points[:, 0] < centroid[0]]
        right_side = jaw_points[jaw_points[:, 0] > centroid[0]]
        
        left_dist = np.mean(np.abs(left_side[:, 0] - centroid[0]))
        right_dist = np.mean(np.abs(right_side[:, 0] - centroid[0]))
        
        symmetry = 1 - abs(left_dist - right_dist) / (left_dist + right_dist)
        
        return max(0, min(1, symmetry))