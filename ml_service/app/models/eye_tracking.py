import mediapipe as mp
import numpy as np
from ..utils.image_processing import convert_to_rgb

class EyeTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def get_eye_landmarks(self, image):
        """Extract eye landmarks from the image."""
        rgb_image = convert_to_rgb(image)
        results = self.face_mesh.process(rgb_image)
        
        if not results.multi_face_landmarks:
            return None

        landmarks = results.multi_face_landmarks[0].landmark
        
        # MediaPipe indices for eye landmarks
        LEFT_EYE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7]
        RIGHT_EYE = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382]

        height, width = image.shape[:2]
        
        left_eye_points = [(landmarks[i].x * width, landmarks[i].y * height) for i in LEFT_EYE]
        right_eye_points = [(landmarks[i].x * width, landmarks[i].y * height) for i in RIGHT_EYE]

        return {
            "left_eye": left_eye_points,
            "right_eye": right_eye_points
        }

    def analyze_eye_movement(self, image):
        """Analyze eye movement and position."""
        eye_landmarks = self.get_eye_landmarks(image)
        
        if not eye_landmarks:
            return {
                "success": False,
                "error": "No face detected"
            }

        # Calculate eye aspect ratio (EAR) for blink detection
        def eye_aspect_ratio(eye_points):
            vertical_dist1 = np.linalg.norm(np.array(eye_points[1]) - np.array(eye_points[5]))
            vertical_dist2 = np.linalg.norm(np.array(eye_points[2]) - np.array(eye_points[4]))
            horizontal_dist = np.linalg.norm(np.array(eye_points[0]) - np.array(eye_points[3]))
            ear = (vertical_dist1 + vertical_dist2) / (2.0 * horizontal_dist)
            return ear

        left_ear = eye_aspect_ratio(eye_landmarks["left_eye"])
        right_ear = eye_aspect_ratio(eye_landmarks["right_eye"])

        return {
            "success": True,
            "metrics": {
                "left_eye_ear": float(left_ear),
                "right_eye_ear": float(right_ear),
                "symmetry": float(abs(left_ear - right_ear))
            }
        }