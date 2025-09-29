"""
Advanced Text Placement System using Computer Vision
Analyzes meme templates to find optimal text placement zones
"""

import cv2
import numpy as np
from PIL import Image, ImageDraw
import json
from typing import Dict, List, Tuple, Optional

class MemeAnalyzer:
    """Analyze meme templates for optimal text placement"""
    
    def __init__(self):
        self.face_cascade = None
        self.load_opencv_models()
    
    def load_opencv_models(self):
        """Load OpenCV models for face/object detection"""
        try:
            # Try to load face cascade
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        except Exception as e:
            print(f"Warning: Could not load OpenCV models: {e}")
    
    def analyze_template(self, image_path: str) -> Dict:
        """Analyze a meme template and suggest text zones"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                return self.get_fallback_zones()
            
            height, width = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            faces = self.detect_faces(gray) if self.face_cascade is not None else []
            
            # Find text-friendly areas
            text_zones = self.find_text_zones(image, faces)
            
            # Determine layout type
            layout_type = self.determine_layout_type(image, faces, text_zones)
            
            return {
                "text_zones": text_zones,
                "layout_type": layout_type,
                "faces_detected": len(faces),
                "optimal_text_count": min(len(text_zones), 3)
            }
            
        except Exception as e:
            print(f"Error analyzing template: {e}")
            return self.get_fallback_zones()
    
    def detect_faces(self, gray_image) -> List[Tuple]:
        """Detect faces in the image"""
        if self.face_cascade is None:
            return []
        
        try:
            faces = self.face_cascade.detectMultiScale(
                gray_image, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            return faces.tolist()
        except:
            return []
    
    def find_text_zones(self, image, faces: List) -> List[Dict]:
        """Find optimal text placement zones avoiding faces and busy areas"""
        height, width = image.shape[:2]
        zones = []
        
        # Convert faces to exclusion zones (with padding)
        exclusion_zones = []
        for (x, y, w, h) in faces:
            # Add padding around faces
            padding = max(w, h) * 0.2
            exclusion_zones.append({
                'x': max(0, x - padding),
                'y': max(0, y - padding),
                'width': w + 2 * padding,
                'height': h + 2 * padding
            })
        
        # Define potential text areas
        potential_zones = [
            # Top area
            {
                "zone_name": "top_area",
                "x_percent": 0.1, "y_percent": 0.05,
                "width_percent": 0.8, "height_percent": 0.2,
                "alignment": "center", "text_size": "medium",
                "priority": 1
            },
            # Bottom area
            {
                "zone_name": "bottom_area",
                "x_percent": 0.1, "y_percent": 0.75,
                "width_percent": 0.8, "height_percent": 0.2,
                "alignment": "center", "text_size": "medium",
                "priority": 1
            },
            # Left side
            {
                "zone_name": "left_area",
                "x_percent": 0.05, "y_percent": 0.3,
                "width_percent": 0.4, "height_percent": 0.4,
                "alignment": "center", "text_size": "small",
                "priority": 2
            },
            # Right side
            {
                "zone_name": "right_area",
                "x_percent": 0.55, "y_percent": 0.3,
                "width_percent": 0.4, "height_percent": 0.4,
                "alignment": "center", "text_size": "small",
                "priority": 2
            },
            # Center (for single text memes)
            {
                "zone_name": "center_area",
                "x_percent": 0.25, "y_percent": 0.4,
                "width_percent": 0.5, "height_percent": 0.2,
                "alignment": "center", "text_size": "large",
                "priority": 3
            }
        ]
        
        # Filter zones that don't overlap with faces
        for zone in potential_zones:
            zone_x = int(zone["x_percent"] * width)
            zone_y = int(zone["y_percent"] * height) 
            zone_w = int(zone["width_percent"] * width)
            zone_h = int(zone["height_percent"] * height)
            
            # Check if zone overlaps significantly with any face
            overlaps = False
            for exc_zone in exclusion_zones:
                if self.zones_overlap(
                    zone_x, zone_y, zone_w, zone_h,
                    exc_zone['x'], exc_zone['y'], exc_zone['width'], exc_zone['height']
                ):
                    overlaps = True
                    break
            
            if not overlaps:
                zones.append(zone)
        
        # Sort by priority
        zones.sort(key=lambda x: x.get('priority', 99))
        
        return zones[:4]  # Return top 4 zones
    
    def zones_overlap(self, x1, y1, w1, h1, x2, y2, w2, h2, threshold=0.3) -> bool:
        """Check if two zones overlap significantly"""
        # Calculate intersection
        left = max(x1, x2)
        top = max(y1, y2)
        right = min(x1 + w1, x2 + w2)
        bottom = min(y1 + h1, y2 + h2)
        
        if left >= right or top >= bottom:
            return False
        
        intersection_area = (right - left) * (bottom - top)
        zone1_area = w1 * h1
        
        # If intersection is more than threshold of zone1 area, consider it overlap
        return (intersection_area / zone1_area) > threshold
    
    def determine_layout_type(self, image, faces: List, zones: List) -> str:
        """Determine the type of meme layout"""
        if len(faces) >= 3:
            return "multi_character_labels"
        elif len(faces) == 2:
            return "two_character_comparison"
        elif len(faces) == 1:
            return "single_character_reaction"
        elif len(zones) >= 4:
            return "complex_layout"
        elif len(zones) >= 2:
            return "classic_top_bottom"
        else:
            return "simple_single_text"
    
    def get_fallback_zones(self) -> Dict:
        """Fallback zones when analysis fails"""
        return {
            "text_zones": [
                {
                    "zone_name": "top_safe",
                    "x_percent": 0.1, "y_percent": 0.05,
                    "width_percent": 0.8, "height_percent": 0.15,
                    "alignment": "center", "text_size": "medium",
                    "priority": 1, "description": "Safe top area"
                },
                {
                    "zone_name": "bottom_safe",
                    "x_percent": 0.1, "y_percent": 0.8,
                    "width_percent": 0.8, "height_percent": 0.15,
                    "alignment": "center", "text_size": "medium", 
                    "priority": 1, "description": "Safe bottom area"
                }
            ],
            "layout_type": "fallback_safe",
            "faces_detected": 0,
            "optimal_text_count": 2
        }

    def generate_layout_suggestions(self, template_path: str, template_name: str) -> Dict:
        """Generate comprehensive layout suggestions for a template"""
        analysis = self.analyze_template(template_path)
        
        # Add template-specific optimizations
        if "drake" in template_name.lower():
            analysis["text_zones"] = [
                {
                    "zone_name": "reject_option",
                    "x_percent": 0.5, "y_percent": 0.2,
                    "width_percent": 0.45, "height_percent": 0.3,
                    "alignment": "left", "text_size": "medium",
                    "priority": 1, "description": "Thing Drake rejects"
                },
                {
                    "zone_name": "approve_option",
                    "x_percent": 0.5, "y_percent": 0.7,
                    "width_percent": 0.45, "height_percent": 0.3,
                    "alignment": "left", "text_size": "medium",
                    "priority": 1, "description": "Thing Drake approves"
                }
            ]
            analysis["layout_type"] = "drake_choice"
        
        elif "two buttons" in template_name.lower():
            analysis["text_zones"] = [
                {
                    "zone_name": "left_button",
                    "x_percent": 0.12, "y_percent": 0.32,
                    "width_percent": 0.25, "height_percent": 0.15,
                    "alignment": "center", "text_size": "small",
                    "priority": 1, "description": "Left choice"
                },
                {
                    "zone_name": "right_button",
                    "x_percent": 0.63, "y_percent": 0.32,
                    "width_percent": 0.25, "height_percent": 0.15,
                    "alignment": "center", "text_size": "small",
                    "priority": 1, "description": "Right choice"
                }
            ]
            analysis["layout_type"] = "difficult_choice"
        
        return analysis


# Integration function for the main MemeGenerator class
def enhance_meme_generator_with_cv():
    """Function to integrate CV analysis into the main meme generator"""
    print("Computer Vision meme analysis module loaded!")
    return MemeAnalyzer()

if __name__ == "__main__":
    # Test the analyzer
    analyzer = MemeAnalyzer()
    print("🔍 Meme Analyzer initialized")
    print("Ready to analyze meme templates for optimal text placement!")
