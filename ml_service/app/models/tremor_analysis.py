import mediapipe as mp
import numpy as np
import cv2
from scipy.fft import fft
from scipy.signal import find_peaks

class TremorAnalyzer:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        # Store hand positions over time for frequency analysis
        self.hand_positions = []
        
    def process_frame(self, frame):
        """Process a single frame and extract hand landmarks."""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if not results.multi_hand_landmarks:
            return None
            
        hand_landmarks = []
        for hand_landmarks in results.multi_hand_landmarks:
            # Extract key points (index finger tip, wrist)
            index_tip = hand_landmarks.landmark[8]  # Index finger tip
            wrist = hand_landmarks.landmark[0]      # Wrist
            
            height, width, _ = frame.shape
            index_tip_pos = (int(index_tip.x * width), int(index_tip.y * height))
            wrist_pos = (int(wrist.x * width), int(wrist.y * height))
            
            hand_landmarks.append({
                'index_tip': index_tip_pos,
                'wrist': wrist_pos
            })
            
        return hand_landmarks
        
    def add_frame_data(self, hand_landmarks):
        """Add hand position data from current frame."""
        if hand_landmarks:
            # Track the index finger tip position
            self.hand_positions.append(hand_landmarks[0]['index_tip'])
            
    def analyze_tremor(self):
        """Analyze tremor frequency using FFT."""
        if len(self.hand_positions) < 30:  # Need enough frames for analysis
            return {
                "success": False,
                "error": "Not enough frames for analysis"
            }
            
        # Extract x and y coordinates
        x_positions = [pos[0] for pos in self.hand_positions]
        y_positions = [pos[1] for pos in self.hand_positions]
        
        # Compute displacement from mean position
        x_displacement = np.array(x_positions) - np.mean(x_positions)
        y_displacement = np.array(y_positions) - np.mean(y_positions)
        
        # Compute total displacement
        total_displacement = np.sqrt(x_displacement**2 + y_displacement**2)
        
        # Perform FFT
        fft_result = np.abs(fft(total_displacement))
        fft_result = fft_result[:len(fft_result)//2]  # Take only first half (positive frequencies)
        
        # Find peaks in the frequency spectrum
        peaks, _ = find_peaks(fft_result, height=np.max(fft_result)/10)
        
        if len(peaks) == 0:
            tremor_frequency = 0
            tremor_amplitude = 0
        else:
            # Get the dominant frequency
            dominant_peak = peaks[np.argmax(fft_result[peaks])]
            # Assuming 30 fps video
            tremor_frequency = dominant_peak * 30 / len(total_displacement)
            tremor_amplitude = np.max(total_displacement)
        
        # Reset for next analysis
        self.hand_positions = []
        
        # Classify tremor based on frequency
        tremor_type = "None"
        if tremor_frequency > 0:
            if 4 <= tremor_frequency <= 7:
                tremor_type = "Resting"
            elif 7 < tremor_frequency <= 12:
                tremor_type = "Postural/Action"
            
        return {
            "success": True,
            "metrics": {
                "tremor_frequency": float(tremor_frequency),
                "tremor_amplitude": float(tremor_amplitude),
                "tremor_type": tremor_type
            }
        }