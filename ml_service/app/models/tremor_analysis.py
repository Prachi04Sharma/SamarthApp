import mediapipe as mp
import numpy as np
import cv2
from scipy.fft import fft
from scipy.signal import find_peaks, butter, filtfilt
import logging

logger = logging.getLogger(__name__)

class TremorAnalyzer:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        self.positions = []
        self.fps = 30  # Standard webcam frame rate
        
        # Adjusted constants for aggressive movements
        self.MIN_FRAMES = 30
        self.FILTER_LOW = 2.0     # Lowered to catch more movements
        self.FILTER_HIGH = 25.0   # Increased for faster movements
        self.PEAK_HEIGHT_RATIO = 0.1  # More sensitive peak detection
        self.PEAK_PROMINENCE_RATIO = 0.05
        self.MIN_AMPLITUDE_THRESHOLD = 5.0  # Lower threshold
        self.VELOCITY_SCALE_FACTOR = 2.0    # Increased scaling for aggressive movements
        
    def process_frame(self, frame):
        """Process a single frame and extract hand landmarks."""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        logger.info(f"Processing frame: shape={frame.shape}")
        
        if not results.multi_hand_landmarks:
            logger.warning("No hand landmarks detected in frame")
            return None
            
        height, width, _ = frame.shape
        landmarks_list = []
        
        for hand_landmarks in results.multi_hand_landmarks:
            # Track index fingertip (landmark 8) and wrist (landmark 0)
            index_tip = hand_landmarks.landmark[8]
            wrist = hand_landmarks.landmark[0]
            
            # Convert to pixel coordinates
            landmarks_list.append({
                'index_tip': (int(index_tip.x * width), int(index_tip.y * height)),
                'wrist': (int(wrist.x * width), int(wrist.y * height))
            })
            
        logger.info(f"Detected {len(landmarks_list)} hands in frame")
        return landmarks_list

    def analyze_tremor(self, positions):
        """Enhanced tremor analysis with fixed frequency calculations."""
        logger.info(f"Starting tremor analysis with {len(positions)} positions")
        
        if len(positions) < self.MIN_FRAMES:
            return self._get_default_metrics()

        try:
            # Extract coordinates
            x_coords = np.array([p[0] for p in positions])
            y_coords = np.array([p[1] for p in positions])
            
            # Calculate velocities
            dx = np.diff(x_coords)
            dy = np.diff(y_coords)
            velocities = np.sqrt(dx**2 + dy**2)
            
            # Log movement stats
            mean_velocity = np.mean(velocities)
            max_velocity = np.max(velocities)
            logger.info(f"Movement stats - Mean velocity: {mean_velocity:.2f}, Max velocity: {max_velocity:.2f}")

            # Check if there's significant movement
            if mean_velocity < self.MIN_AMPLITUDE_THRESHOLD:
                logger.info("Insufficient movement detected")
                return self._get_default_metrics()

            # Normalize positions
            x_norm = (x_coords - np.mean(x_coords)) / (np.std(x_coords) + 1e-6)
            y_norm = (y_coords - np.mean(y_coords)) / (np.std(y_coords) + 1e-6)

            # Calculate proper filter frequencies
            nyquist = self.fps / 2.0
            low = min(0.99, max(0.01, self.FILTER_LOW / nyquist))
            high = min(0.99, max(low + 0.01, self.FILTER_HIGH / nyquist))
            
            logger.info(f"Filter frequencies - Low: {low:.3f}, High: {high:.3f}")

            # Apply bandpass filter
            b, a = butter(2, [low, high], btype='band')
            x_filtered = filtfilt(b, a, x_norm)
            y_filtered = filtfilt(b, a, y_norm)
            
            # Calculate displacement
            displacement = np.sqrt(x_filtered**2 + y_filtered**2)
            
            # FFT analysis
            window = np.hanning(len(displacement))
            windowed = displacement * window
            fft_result = np.abs(fft(windowed))[:len(windowed)//2]
            frequencies = np.linspace(0, self.fps/2, len(windowed)//2)
            
            # Improved peak detection
            peaks, properties = find_peaks(
                fft_result,
                height=np.max(fft_result) * self.PEAK_HEIGHT_RATIO,
                distance=3,
                prominence=np.max(fft_result) * self.PEAK_PROMINENCE_RATIO
            )
            
            logger.info(f"Found {len(peaks)} peaks in frequency domain")
            
            if len(peaks) > 0:
                # Get dominant frequency
                peak_heights = fft_result[peaks]
                max_peak_idx = peaks[np.argmax(peak_heights)]
                tremor_frequency = frequencies[max_peak_idx]
                
                # Calculate amplitude from velocities
                tremor_amplitude = min(100, mean_velocity * self.VELOCITY_SCALE_FACTOR)
                
                logger.info(f"Tremor detected - Frequency: {tremor_frequency:.2f} Hz, "
                          f"Amplitude: {tremor_amplitude:.2f}")
                
                return {
                    'tremor_frequency': float(tremor_frequency),
                    'tremor_amplitude': float(tremor_amplitude),
                    'tremor_type': self._get_tremor_type(tremor_frequency),
                    'severity': self._get_severity(tremor_amplitude),
                    'peak_count': len(peaks)
                }
            else:
                # Irregular movement detected
                irregular_amplitude = min(100, mean_velocity * self.VELOCITY_SCALE_FACTOR)
                logger.info(f"Irregular movement detected - Amplitude: {irregular_amplitude:.2f}")
                
                return {
                    'tremor_frequency': 0,
                    'tremor_amplitude': float(irregular_amplitude),
                    'tremor_type': 'Irregular',
                    'severity': self._get_severity(irregular_amplitude),
                    'peak_count': 0
                }
                
        except Exception as e:
            logger.error(f"Error in tremor analysis: {str(e)}", exc_info=True)
            
        return self._get_default_metrics()

    def _get_tremor_type(self, frequency):
        """Enhanced tremor type classification"""
        if 2 <= frequency < 4:
            return 'Very Slow'
        elif 4 <= frequency <= 7:
            return 'Resting'
        elif 7 < frequency <= 12:
            return 'Postural'
        elif frequency > 12:
            return 'Action/Intention'
        return 'None'

    def _get_severity(self, amplitude):
        """Adjusted severity thresholds"""
        if amplitude > 60:
            return 'Very Severe'
        elif amplitude > 40:
            return 'Severe'
        elif amplitude > 20:
            return 'Moderate'
        elif amplitude > 5:
            return 'Mild'
        return 'None'

    def _get_default_metrics(self):
        """Return default metrics structure."""
        return {
            'tremor_frequency': 0,
            'tremor_amplitude': 0,
            'tremor_type': 'None',
            'severity': 'None',
            'peak_count': 0
        }

    def add_position(self, position):
        """Add a position to the analysis buffer."""
        if position:
            self.positions.append(position)