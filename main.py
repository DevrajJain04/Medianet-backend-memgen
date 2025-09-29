import os
import json
import random
import base64
from io import BytesIO
from typing import List, Dict, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import google.generativeai as genai
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Pydantic models for request validation
class MemeGenerationRequest(BaseModel):
    text_input: str
    image_description: Optional[str] = None
    template_id: Optional[str] = None
    use_gemini_vision: bool = True

class TemplateSuggestionRequest(BaseModel):
    text_input: str
    top_k: int = 5

# Initialize FastAPI app
app = FastAPI(title="AI Meme Generator", description="Generate memes using Gemini AI")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="images"), name="static")

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class MemeGenerator:
    def __init__(self):
        self.load_meme_templates()
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.template_layouts = self.load_template_layouts()
        
    def load_meme_templates(self):
        """Load available meme templates from memes.json"""
        try:
            with open("memes.json", "r") as file:
                data = json.load(file)
                self.templates = data.get("data", {}).get("memes", [])
        except FileNotFoundError:
            print("memes.json not found. Loading templates from API...")
            self.download_meme_templates()
    
    def download_meme_templates(self):
        """Download meme templates if not available locally"""
        import requests
        response = requests.get("https://api.imgflip.com/get_memes")
        
        if response.status_code == 200:
            with open("memes.json", "w") as file:
                file.write(response.text)
            self.templates = response.json().get("data", {}).get("memes", [])
            
            # Download template images
            os.makedirs("images", exist_ok=True)
            for meme in self.templates:
                url = meme.get("url", "")
                if url:
                    try:
                        img_response = requests.get(url)
                        if img_response.status_code == 200:
                            filename = url.split('/')[-1]
                            with open(f"images/{filename}", "wb") as img_file:
                                img_file.write(img_response.content)
                    except Exception as e:
                        print(f"Error downloading {url}: {e}")
        else:
            raise HTTPException(status_code=500, detail="Failed to load meme templates")
    
    def encode_image_to_base64(self, image_path: str) -> str:
        """Convert image to base64 for Gemini API"""
        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode('utf-8')
    
    def image_to_base64(self, image_path: str) -> str:
        """Convert image file to base64 string for frontend display"""
        try:
            with open(image_path, "rb") as img_file:
                encoded_string = base64.b64encode(img_file.read()).decode('utf-8')
                return f"data:image/jpeg;base64,{encoded_string}"
        except Exception as e:
            print(f"Error encoding image to base64: {e}")
            return ""
    
    async def generate_meme_text(self, user_image: Optional[UploadFile], user_text: str, meme_context: str = "") -> Dict:
        """Generate meme text using Gemini AI"""
        try:
            # Create prompt for meme generation
            prompt = f"""
            You are a creative meme generator. Based on the following context, generate funny and relevant meme text:
            
            User Text/Context: {user_text}
            Meme Template Context: {meme_context}
            
            Instructions:
            1. Generate witty, funny, and relatable meme text
            2. Keep text concise and punchy
            3. Make it relevant to current trends/situations and supportive of the advertising brand who's user text is given
            4. Return response in strict JSON format with the following structure:
            {{
                "top_text": "Text for top of meme (if applicable)",
                "bottom_text": "Text for bottom of meme (if applicable)", 
                "single_text": "Single text for simple memes",
                "style": "humorous/sarcastic/relatable/trending/non-offensive/brand-supportive",
                "explanation": "Brief explanation of the meme concept"
            }}
            
            Make it funny and shareable!
            """
            
            # If user uploaded an image, include it in the analysis
            if user_image:
                # Read uploaded image
                image_content = await user_image.read()
                image = Image.open(BytesIO(image_content))
                
                # Save temporarily for processing
                temp_path = f"temp_{user_image.filename}"
                image.save(temp_path)
                
                try:
                    # Include image in prompt
                    response = self.model.generate_content([prompt, image])
                finally:
                    # Clean up temp file
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
            else:
                response = self.model.generate_content(prompt)
            
            # Parse JSON response
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
                
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "top_text": "",
                    "bottom_text": response_text,
                    "single_text": response_text,
                    "style": "humorous",
                    "explanation": "AI generated meme text"
                }
                
        except Exception as e:
            print(f"Error generating meme text: {e}")
            return {
                "top_text": "",
                "bottom_text": "When AI fails to generate memes",
                "single_text": "AI meme generation error",
                "style": "meta",
                "explanation": "Fallback meme text"
            }
    
    def get_template_options_for_ai(self) -> str:
        """Get formatted template options for AI selection"""
        template_options = []
        
        # Get templates that have layouts defined
        for template_id, layout_info in self.template_layouts.items():
            # Find the corresponding template from memes.json
            template = next((t for t in self.templates if t["id"] == template_id), None)
            if template:
                template_info = {
                    "id": template_id,
                    "name": layout_info["name"],
                    "description": layout_info.get("description", f"Template for {layout_info['layout_type']} style memes"),
                    "layout_type": layout_info["layout_type"],
                    "optimal_text_count": layout_info["optimal_text_count"],
                    "use_case": self.get_template_use_case(layout_info["layout_type"])
                }
                template_options.append(template_info)
        
        # Add some popular fallback templates that might not have layouts
        popular_fallbacks = [
            {"id": "61579", "name": "One Does Not Simply", "use_case": "Expressing difficulty or impossibility"},
            {"id": "101470", "name": "Ancient Aliens", "use_case": "Explaining unexplained phenomena"},
            {"id": "4087833", "name": "Waiting Skeleton", "use_case": "Waiting for something that takes forever"},
            {"id": "61544", "name": "Success Kid", "use_case": "Celebrating achievements or victories"},
            {"id": "61520", "name": "Futurama Fry", "use_case": "Expressing suspicion or uncertainty"}
        ]
        
        for fallback in popular_fallbacks:
            if not any(t["id"] == fallback["id"] for t in template_options):
                template_options.append(fallback)
        
        # Format for AI prompt
        formatted_options = "\n".join([
            f"- ID: {opt['id']} | Name: {opt['name']} | Use Case: {opt.get('use_case', 'General meme')}"
            for opt in template_options
        ])
        
        return formatted_options
    
    def load_template_layouts(self):
        """Load predefined template layouts"""
        try:
            with open("template_layouts.json", "r") as file:
                return json.load(file)
        except FileNotFoundError:
            return {}
    
    def get_template_use_case(self, layout_type: str) -> str:
        """Get human-readable use case description for layout types"""
        use_cases = {
            "drake_choice": "Comparing two options, rejecting one and approving another",
            "difficult_choice": "Presenting a difficult decision with multiple options",
            "three_character_labels": "Labeling characters in a relationship dynamic",
            "single_request": "Making a request or statement",
            "choice_diversion": "Choosing between a safe path and risky alternative",
            "progressive_chase": "Chasing after increasingly desirable things",
            "ultimatum_choice": "Choosing between doing something difficult or accepting consequences",
            "chaotic_satisfaction": "Expressing satisfaction with causing chaos",
            "emotional_cycle": "Showing emotional ups and downs",
            "mutual_agreement": "Two parties agreeing on something",
            "plan_backfire": "Plans going wrong step by step",
            "eternal_wait": "Waiting for something that never comes",
            "dark_revelation": "Revealing a shocking truth",
            "single_statement": "Making a bold controversial statement",
            "dark_implication": "Implying something dark or concerning",
            "correction_slap": "Correcting someone's inappropriate statement",
            "observation_meme": "Pointing out something that's everywhere",
            "argument_response": "Argument between two parties",
            "then_vs_now": "Comparing past strength with present weakness",
            "trade_proposal": "Proposing an exchange or deal",
            "progressive_intelligence": "Showing levels of thinking from basic to enlightened",
            "victory_celebration": "Celebrating success or achievement",
            "class_distinction": "Showing normal vs sophisticated versions",
            "assumption_vs_reality": "What someone thinks vs reality",
            "self_sabotage_blame": "Causing own problems then blaming others",
            "impossibility_statement": "Stating something is impossible or very difficult",
            "addiction_craving": "Expressing craving or addiction to something",
            "aliens_explanation": "Using aliens to explain unexplained phenomena",
            "false_distinction": "Showing two things that are actually the same",
            "awkward_caught": "Being caught in awkward situation",
            "ironic_calm": "Being calm in obviously bad situation",
            "mocking_repetition": "Mocking someone by repeating their words",
            "missing_out": "Discovering others get benefits you don't",
            "compulsive_action": "Compulsively doing something repeatedly",
            "boardroom_rejection": "Corporate meeting where good idea gets rejected",
            "painful_smile": "Hiding pain behind a smile",
            "suspicious_uncertainty": "Being unsure or suspicious about something",
            "panic_cycle": "Panic, brief calm, then more panic",
            "inner_evil_voice": "Inner voice suggesting bad things",
            "predictable_surprise": "Being surprised by predictable consequences",
            "escalating_argument": "Argument that escalates through multiple stages",
            "classic_top_bottom": "Traditional top and bottom text meme format"
        }
        return use_cases.get(layout_type, "General purpose meme template")

    async def select_optimal_template(self, text_input: str, user_context: str = "") -> Dict:
        """Use AI to select the most appropriate template for the given text"""
        try:
            template_options = self.get_template_options_for_ai()
            
            prompt = f"""
            You are an expert meme curator. Analyze the following text input and select the MOST APPROPRIATE meme template from the available options.

            Text Input: "{text_input}"
            Additional Context: "{user_context}"

            Available Templates:
            {template_options}

            Instructions:
            1. Analyze the sentiment, context, and structure of the text input
            2. Match it with the most suitable template based on the use case
            3. Consider what type of meme format would best express this concept
            4. Choose the template that maximizes comedic impact and relatability

            Return your response in this JSON format:
            {{
                "selected_template_id": "template_id",
                "template_name": "Template Name",
                "reasoning": "Detailed explanation of why this template is perfect for the input",
                "meme_concept": "Brief description of how this will work as a meme",
                "confidence_score": 0.95
            }}

            Choose wisely to create the most impactful and funny meme!
            """

            response = self.model.generate_content(prompt)
            
            # Parse JSON response
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
            
            try:
                selection_result = json.loads(response_text)
                
                # Validate that the selected template exists
                selected_id = selection_result.get("selected_template_id")
                template = next((t for t in self.templates if t["id"] == selected_id), None)
                
                if template:
                    print(f"🎯 AI Selected Template: {selection_result.get('template_name')} (ID: {selected_id})")
                    print(f"🤖 Reasoning: {selection_result.get('reasoning')}")
                    return {
                        "template": template,
                        "selection_reasoning": selection_result
                    }
                else:
                    print(f"⚠️  Selected template {selected_id} not found, using fallback...")
                    return self.get_fallback_template_selection()
                    
            except json.JSONDecodeError as e:
                print(f"JSON parsing error in template selection: {e}")
                return self.get_fallback_template_selection()
                
        except Exception as e:
            print(f"Error in AI template selection: {e}")
            return self.get_fallback_template_selection()
    
    def get_fallback_template_selection(self) -> Dict:
        """Fallback template selection when AI selection fails"""
        # Use Drake template as a versatile fallback
        drake_template = next((t for t in self.templates if t["id"] == "181913649"), None)
        if drake_template:
            return {
                "template": drake_template,
                "selection_reasoning": {
                    "selected_template_id": "181913649",
                    "template_name": "Drake Hotline Bling",
                    "reasoning": "Fallback selection - Drake format is versatile for comparisons",
                    "meme_concept": "Comparing two options or concepts",
                    "confidence_score": 0.7
                }
            }
        
        # If Drake not available, use any popular template
        popular_templates = [t for t in self.templates if t.get("captions", 0) > 100000]
        fallback_template = popular_templates[0] if popular_templates else self.templates[0]
        
        return {
            "template": fallback_template,
            "selection_reasoning": {
                "selected_template_id": fallback_template["id"],
                "template_name": fallback_template["name"],
                "reasoning": "Emergency fallback selection",
                "meme_concept": "General meme format",
                "confidence_score": 0.5
            }
        }
    
    async def analyze_template_for_text_placement(self, template_path: str, template_name: str) -> Dict:
        """Use AI to analyze template and suggest optimal text placement"""
        try:
            prompt = f"""
            Analyze this meme template image "{template_name}" and suggest optimal text placement zones.
            
            Consider:
            1. Where are the main subjects/faces/objects?
            2. What are the empty/text-friendly areas?
            3. What's the visual flow and reading pattern?
            4. How many text zones would work best?
            
            Return a JSON response with text placement suggestions:
            {{
                "text_zones": [
                    {{
                        "zone_name": "descriptive name",
                        "x_percent": 0.5, "y_percent": 0.1,
                        "width_percent": 0.4, "height_percent": 0.2,
                        "alignment": "center|left|right",
                        "text_size": "small|medium|large",
                        "priority": 1,
                        "description": "where this text should go"
                    }}
                ],
                "layout_type": "description of layout pattern",
                "optimal_text_count": 2
            }}
            
            Use percentage-based positioning (0.0 to 1.0) for scalability.
            """
            
            # Load and analyze the image
            image = Image.open(template_path)
            response = self.model.generate_content([prompt, image])
            
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
            
            return json.loads(response_text)
            
        except Exception as e:
            print(f"Error analyzing template: {e}")
            return self.get_fallback_layout()
    
    def get_fallback_layout(self):
        """Fallback layout when AI analysis fails"""
        return {
            "text_zones": [
                {
                    "zone_name": "top_area",
                    "x_percent": 0.5, "y_percent": 0.1,
                    "width_percent": 0.8, "height_percent": 0.2,
                    "alignment": "center", "text_size": "medium",
                    "priority": 1, "description": "Top text area"
                },
                {
                    "zone_name": "bottom_area", 
                    "x_percent": 0.5, "y_percent": 0.85,
                    "width_percent": 0.8, "height_percent": 0.2,
                    "alignment": "center", "text_size": "medium",
                    "priority": 2, "description": "Bottom text area"
                }
            ],
            "layout_type": "classic_top_bottom",
            "optimal_text_count": 2
        }

    def wrap_text(self, text: str, font, max_width: int) -> List[str]:
        """Wrap text to fit within specified width"""
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = font.getbbox(test_line) if font and hasattr(font, 'getbbox') else (0, 0, len(test_line) * 10, 20)
            
            if bbox[2] - bbox[0] <= max_width or not current_line:
                current_line.append(word)
            else:
                lines.append(' '.join(current_line))
                current_line = [word]
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines

    def draw_text_in_zone(self, draw, text: str, zone: Dict, image_size: tuple, font):
        """Draw text within a specific zone with proper wrapping and alignment"""
        # Handle case where text might be a list (defensive programming)
        if isinstance(text, list):
            text = ' '.join(str(item) for item in text)
        
        if not text or not str(text).strip():
            return
            
        text = str(text).upper()  # Ensure text is string and uppercase for memes
        width, height = image_size
        
        # Calculate actual zone dimensions
        zone_x = int(zone["x_percent"] * width)
        zone_y = int(zone["y_percent"] * height)
        zone_width = int(zone["width_percent"] * width)
        zone_height = int(zone["height_percent"] * height)
        
        # Better font size calculation based on image size and zone
        base_font_size = max(width // 20, height // 20)  # Responsive to image size
        size_multiplier = {"small": 0.6, "medium": 1.0, "large": 1.4}.get(zone.get("text_size", "medium"), 1.0)
        adjusted_font_size = int(base_font_size * size_multiplier)
        adjusted_font_size = max(adjusted_font_size, 16)  # Minimum readable size for memes
        adjusted_font_size = min(adjusted_font_size, 80)  # Maximum size to prevent overflow
        
        try:
            font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
            adjusted_font = ImageFont.truetype(font_path, adjusted_font_size)
        except:
            # Fallback to default font with size
            try:
                adjusted_font = ImageFont.load_default()
            except:
                adjusted_font = None
        
        # Wrap text to fit zone width with better padding
        max_text_width = zone_width - 40  # More generous padding
        lines = self.wrap_text(text, adjusted_font, max_text_width)
        
        if not lines:
            return
        
        # Calculate line height with proper spacing
        if adjusted_font:
            line_height = adjusted_font_size + 8  # Better line spacing
        else:
            line_height = 30
            
        total_text_height = len(lines) * line_height
        
        # Center text vertically in zone with bounds checking
        start_y = zone_y + max(0, (zone_height - total_text_height) // 2)
        
        # Ensure text doesn't go outside image bounds
        if start_y + total_text_height > height:
            start_y = max(0, height - total_text_height - 10)
        
        # Draw each line with proper positioning
        for i, line in enumerate(lines):
            if not line.strip():
                continue
                
            # Get actual text dimensions
            if adjusted_font and hasattr(adjusted_font, 'getbbox'):
                bbox = adjusted_font.getbbox(line)
                line_width = bbox[2] - bbox[0]
            else:
                # Fallback calculation
                line_width = len(line) * (adjusted_font_size * 0.6) if adjusted_font_size else len(line) * 12
            
            # Calculate x position based on alignment with bounds checking
            alignment = zone.get("alignment", "center")
            if alignment == "center":
                text_x = zone_x + max(0, (zone_width - line_width) // 2)
            elif alignment == "left":
                text_x = zone_x + 20  # Padding from left
            else:  # right
                text_x = zone_x + zone_width - line_width - 20  # Padding from right
            
            # Ensure text doesn't go outside image bounds
            text_x = max(10, min(text_x, width - line_width - 10))
            text_y = start_y + (i * line_height)
            
            # Ensure y position is within bounds
            text_y = max(10, min(text_y, height - line_height))
            
            # Draw text with outline for better visibility
            self.draw_text_with_outline(draw, (text_x, text_y), line, adjusted_font)

    def draw_text_with_outline(self, draw, position, text, font, fill_color="white", outline_color="black", outline_width=3):
        """Draw text with thick outline for better visibility on memes"""
        x, y = position
        
        if not font:
            # Use a larger outline for default font
            outline_width = 2
        
        # Draw thicker outline by drawing multiple times
        for dx in range(-outline_width, outline_width + 1):
            for dy in range(-outline_width, outline_width + 1):
                if dx != 0 or dy != 0:
                    # Calculate distance from center for smooth outline
                    distance = (dx * dx + dy * dy) ** 0.5
                    if distance <= outline_width:
                        draw.text((x + dx, y + dy), text, font=font, fill=outline_color)
        
        # Draw main text on top
        draw.text(position, text, font=font, fill=fill_color)

    def draw_basic_text(self, draw, text: str, position: str, image_size: tuple, font):
        """Basic text placement fallback with improved positioning"""
        # Handle case where text might be a list (defensive programming)
        if isinstance(text, list):
            text = ' '.join(str(item) for item in text)
            
        if not text or not str(text).strip():
            return
            
        text = str(text).upper()  # Ensure text is string and uppercase
        width, height = image_size
        
        # Better font size calculation
        base_font_size = max(width // 20, height // 20)
        font_size = max(base_font_size, 20)  # Minimum 20px for readability
        font_size = min(font_size, 60)  # Maximum 60px to prevent overflow
        
        try:
            font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
            adjusted_font = ImageFont.truetype(font_path, font_size)
        except:
            adjusted_font = None
        
        # Wrap text if it's too long
        max_width = int(width * 0.9)  # Use 90% of image width
        lines = self.wrap_text(text, adjusted_font, max_width)
        
        if not lines:
            return
        
        # Calculate total text dimensions
        line_height = font_size + 8 if adjusted_font else 30
        total_text_height = len(lines) * line_height
        
        # Position based on type with better spacing
        margin_y = height // 15  # Dynamic vertical margin
        
        if position == "top":
            start_y = margin_y
        elif position == "bottom":
            start_y = height - total_text_height - margin_y
        else:  # center
            start_y = (height - total_text_height) // 2
        
        # Ensure y position is within bounds
        start_y = max(10, min(start_y, height - total_text_height - 10))
        
        # Draw each line centered horizontally
        for i, line in enumerate(lines):
            if not line.strip():
                continue
                
            # Calculate text width
            if adjusted_font and hasattr(adjusted_font, 'getbbox'):
                bbox = adjusted_font.getbbox(line)
                text_width = bbox[2] - bbox[0]
            else:
                text_width = len(line) * (font_size * 0.6) if font_size else len(line) * 12
            
            # Center horizontally
            x = (width - text_width) // 2
            x = max(10, min(x, width - text_width - 10))  # Ensure within bounds
            
            y = start_y + (i * line_height)
            y = max(10, min(y, height - line_height))  # Ensure within bounds
            
            self.draw_text_with_outline(draw, (x, y), line, adjusted_font)

    def get_fallback_layout(self):
        """Fallback layout when no predefined layout exists - classic meme style"""
        return {
            "text_zones": [
                {
                    "zone_name": "top_area",
                    "x_percent": 0.05, "y_percent": 0.02,  # Closer to top edge
                    "width_percent": 0.9, "height_percent": 0.25,  # Wider and taller zone
                    "alignment": "center", "text_size": "medium",
                    "priority": 1, "description": "Top text area"
                },
                {
                    "zone_name": "bottom_area", 
                    "x_percent": 0.05, "y_percent": 0.73,  # Closer to bottom edge
                    "width_percent": 0.9, "height_percent": 0.25,  # Wider and taller zone
                    "alignment": "center", "text_size": "medium",
                    "priority": 2, "description": "Bottom text area"
                }
            ],
            "layout_type": "classic_top_bottom",
            "optimal_text_count": 2
        }

    async def create_meme_with_gemini_vision(self, template_id: str, meme_data: Dict, output_path: str = "generated_meme.jpg"):
        """Create meme using Gemini Vision API for intelligent text placement analysis"""
        try:
            # Find template
            template = next((t for t in self.templates if t["id"] == template_id), None)
            if not template:
                raise ValueError("Template not found")
            
            # Load template image
            template_filename = template["url"].split('/')[-1]
            template_path = f"images/{template_filename}"
            
            if not os.path.exists(template_path):
                raise ValueError("Template image not found locally")
            
            # Load the template image
            image = Image.open(template_path)
            width, height = image.size
            
            # Prepare texts to place
            texts_to_analyze = []
            if meme_data.get("top_text"):
                texts_to_analyze.append({"text": meme_data['top_text'], "type": "top"})
            if meme_data.get("bottom_text"):
                texts_to_analyze.append({"text": meme_data['bottom_text'], "type": "bottom"})
            if meme_data.get("single_text") and not texts_to_analyze:
                texts_to_analyze.append({"text": meme_data['single_text'], "type": "center"})
            
            # Create Gemini prompt for precise text placement analysis
            prompt = f"""
            You are an expert meme creator analyzing this template image "{template.get('name', 'Unknown')}" for optimal text placement.

            Image dimensions: {width}x{height} pixels
            
            Text to place: {[t['text'] for t in texts_to_analyze]}
            
            Analyze the image and provide precise coordinates for text placement that:
            1. Avoids covering important visual elements (faces, key objects)
            2. Uses traditional meme positioning patterns
            3. Ensures maximum readability
            4. Follows meme conventions for this template type
            
            Return a JSON response with text placement coordinates:
            {{
                "text_placements": [
                    {{
                        "text": "the text to place",
                        "x_percent": 0.5,
                        "y_percent": 0.1,
                        "width_percent": 0.8,
                        "height_percent": 0.2,
                        "alignment": "center",
                        "font_size_multiplier": 1.0,
                        "priority": 1,
                        "reasoning": "why this position is optimal"
                    }}
                ],
                "overall_strategy": "explanation of placement strategy",
                "template_analysis": "key visual elements identified"
            }}
            
            Use percentage values (0.0 to 1.0) for scalability. Ensure text doesn't overlap and is highly readable.
            """
            
            try:
                # Send image and prompt to Gemini for analysis
                response = self.model.generate_content([prompt, image])
                
                # Parse the response
                response_text = response.text.strip()
                if response_text.startswith("```json"):
                    response_text = response_text[7:-3].strip()
                elif response_text.startswith("```"):
                    response_text = response_text[3:-3].strip()
                
                placement_data = json.loads(response_text)
                
                # Now use the AI-generated placement data to create the meme
                return await self.create_meme_with_ai_placement(template_id, texts_to_analyze, placement_data, output_path)
                
            except json.JSONDecodeError as e:
                print(f"JSON parsing error in Gemini response: {e}")
                print(f"Raw response: {response.text}")
                return await self.create_meme_fallback(template_id, meme_data, output_path)
            except Exception as e:
                print(f"Gemini vision analysis error: {e}, falling back to manual placement...")
                return await self.create_meme_fallback(template_id, meme_data, output_path)
                
        except Exception as e:
            print(f"Error in Gemini meme creation: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create meme with Gemini: {str(e)}")

    async def create_meme_with_ai_placement(self, template_id: str, texts_to_place: List[Dict], placement_data: Dict, output_path: str):
        """Create meme using AI-generated placement coordinates"""
        try:
            # Find template
            template = next((t for t in self.templates if t["id"] == template_id), None)
            if not template:
                raise ValueError("Template not found")
            
            # Load template image
            template_filename = template["url"].split('/')[-1]
            template_path = f"images/{template_filename}"
            
            if not os.path.exists(template_path):
                raise ValueError("Template image not found locally")
            
            # Open and process image
            image = Image.open(template_path)
            draw = ImageDraw.Draw(image)
            width, height = image.size
            
            # Load font
            try:
                base_font_size = max(width // 60, 10)
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", base_font_size)
            except:
                font = None
            
            # Apply AI-generated text placements
            text_placements = placement_data.get("text_placements", [])
            
            for i, text_info in enumerate(texts_to_place):
                if i < len(text_placements):
                    placement = text_placements[i]
                    
                    # Create zone from AI placement data
                    zone = {
                        "x_percent": placement.get("x_percent", 0.5),
                        "y_percent": placement.get("y_percent", 0.1 + (i * 0.4)),
                        "width_percent": placement.get("width_percent", 0.8),
                        "height_percent": placement.get("height_percent", 0.2),
                        "alignment": placement.get("alignment", "center"),
                        "text_size": self.get_text_size_from_multiplier(placement.get("font_size_multiplier", 1.0)),
                        "priority": placement.get("priority", i + 1),
                        "description": placement.get("reasoning", f"AI placement for {text_info['text']}")
                    }
                    
                    # Place the text using the AI-generated zone
                    self.draw_text_in_zone(draw, text_info["text"], zone, (width, height), font)
                    
                    print(f"✅ AI Placement: '{text_info['text'][:30]}...' at ({zone['x_percent']:.2f}, {zone['y_percent']:.2f})")
                else:
                    # Fallback if not enough placements provided
                    fallback_zone = {
                        "x_percent": 0.5, "y_percent": 0.1 + (i * 0.4),
                        "width_percent": 0.8, "height_percent": 0.2,
                        "alignment": "center", "text_size": "medium",
                        "priority": i + 1, "description": "Fallback placement"
                    }
                    self.draw_text_in_zone(draw, text_info["text"], fallback_zone, (width, height), font)
            
            # Save the meme
            os.makedirs("generated", exist_ok=True)
            output_full_path = f"generated/{output_path}"
            image.save(output_full_path, "JPEG", quality=95)
            
            # Log AI analysis insights
            print(f"🤖 AI Strategy: {placement_data.get('overall_strategy', 'No strategy provided')}")
            print(f"🔍 Template Analysis: {placement_data.get('template_analysis', 'No analysis provided')}")
            
            return output_full_path
            
        except Exception as e:
            print(f"Error creating AI-placed meme: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create AI-placed meme: {str(e)}")

    def get_text_size_from_multiplier(self, multiplier: float) -> str:
        """Convert font size multiplier to text size category"""
        if multiplier <= 0.8:
            return "small"
        elif multiplier >= 1.2:
            return "large"
        else:
            return "medium"

    async def create_meme_fallback(self, template_id: str, meme_data: Dict, output_path: str = "generated_meme.jpg"):
        """Fallback meme creation with manual text placement"""
        try:
            # Find template
            template = next((t for t in self.templates if t["id"] == template_id), None)
            if not template:
                raise ValueError("Template not found")
            
            # Load template image
            template_filename = template["url"].split('/')[-1]
            template_path = f"images/{template_filename}"
            
            if not os.path.exists(template_path):
                raise ValueError("Template image not found locally")
            
            # Open and process image
            image = Image.open(template_path)
            draw = ImageDraw.Draw(image)
            
            # Get image dimensions
            width, height = image.size
            
            # Load font
            try:
                base_font_size = max(width // 60, 10)
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", base_font_size)
            except:
                font = None
            
            # Try to get predefined layout first
            layout = self.template_layouts.get(template_id)
            
            # If no predefined layout, use fallback
            if not layout:
                print(f"No predefined layout for {template['name']}, using fallback...")
                layout = self.get_fallback_layout()
            
            # Prepare text data - simple approach
            top_text = meme_data.get("top_text", "")
            bottom_text = meme_data.get("bottom_text", "")
            single_text = meme_data.get("single_text", "")
            
            # Use the layout zones
            text_zones = layout.get("text_zones", [])
            
            if text_zones and len(text_zones) > 0:
                # Place text using zones
                texts_to_place = []
                if top_text:
                    texts_to_place.append(top_text)
                if bottom_text:
                    texts_to_place.append(bottom_text)
                if single_text and not texts_to_place:
                    texts_to_place.append(single_text)
                
                # Place texts in available zones
                for i, text_content in enumerate(texts_to_place):
                    if i < len(text_zones):
                        zone = text_zones[i]
                        self.draw_text_in_zone(draw, text_content, zone, (width, height), font)
            else:
                # Fallback to basic placement
                if top_text:
                    self.draw_basic_text(draw, top_text, "top", (width, height), font)
                if bottom_text:
                    self.draw_basic_text(draw, bottom_text, "bottom", (width, height), font)
                if single_text and not (top_text or bottom_text):
                    self.draw_basic_text(draw, single_text, "center", (width, height), font)
            
            # Save the meme
            os.makedirs("generated", exist_ok=True)
            output_full_path = f"generated/{output_path}"
            image.save(output_full_path, "JPEG", quality=95)
            
            return output_full_path
            
        except Exception as e:
            print(f"Error creating fallback meme: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create fallback meme: {str(e)}")

    async def create_meme(self, template_id: str, meme_data: Dict, output_path: str = "generated_meme.jpg"):
        """Create meme with intelligent text placement - defaults to Gemini Vision"""
        # Try Gemini Vision first, fallback to manual if needed
        return await self.create_meme_with_gemini_vision(template_id, meme_data, output_path)

# Initialize meme generator
meme_gen = MemeGenerator()

@app.get("/")
async def root():
    return {"message": "AI Meme Generator API", "status": "active"}

@app.get("/templates")
async def get_templates():
    """Get available meme templates with preview images"""
    templates_with_previews = []
    
    for template in meme_gen.templates[:50]:  # Return first 50 templates
        template_data = template.copy()
        
        # Add preview image if exists
        template_filename = template["url"].split('/')[-1]
        template_path = f"images/{template_filename}"
        if os.path.exists(template_path):
            template_data["preview_image"] = meme_gen.image_to_base64(template_path)
        
        templates_with_previews.append(template_data)
    
    return {"templates": templates_with_previews}

@app.get("/templates/{template_id}")
async def get_template_by_id(template_id: str):
    """Get a specific template with preview image"""
    template = next((t for t in meme_gen.templates if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template_data = template.copy()
    
    # Add preview image if exists
    template_filename = template["url"].split('/')[-1]
    template_path = f"images/{template_filename}"
    if os.path.exists(template_path):
        template_data["preview_image"] = meme_gen.image_to_base64(template_path)
    
    return {"template": template_data}

@app.post("/generate-meme")
async def generate_meme(request: MemeGenerationRequest):
    """Generate a meme using AI with intelligent template selection"""
    try:
        # Select template intelligently
        if request.template_id:
            # Use specified template
            template = next((t for t in meme_gen.templates if t["id"] == request.template_id), None)
            if not template:
                return JSONResponse(
                    status_code=404, 
                    content={"error": "Template not found"}
                )
            selection_info = {
                "template": template,
                "selection_reasoning": {
                    "selected_template_id": request.template_id,
                    "template_name": template["name"],
                    "reasoning": "User-specified template",
                    "meme_concept": "User choice",
                    "confidence_score": 1.0
                }
            }
        else:
            # Use AI to select optimal template
            print(f"🧠 AI analyzing text: '{request.text_input[:50]}...'")
            selection_info = await meme_gen.select_optimal_template(request.text_input, request.image_description or "")
            template = selection_info["template"]
        
        # Generate meme text using AI with template context
        template_context = f"Template: {template.get('name', 'Unknown')} (Box count: {template.get('box_count', 2)})"
        layout_info = meme_gen.template_layouts.get(template["id"], {})
        if layout_info:
            template_context += f" - {layout_info.get('layout_type', 'unknown')} style"
        
        meme_data = await meme_gen.generate_meme_text(None, request.text_input, template_context)
        
        # Create the meme
        output_filename = f"meme_{template['id']}_{random.randint(1000, 9999)}.jpg"
        
        if request.use_gemini_vision:
            meme_path = await meme_gen.create_meme_with_gemini_vision(template["id"], meme_data, output_filename)
            method_used = "Gemini Vision API"
        else:
            meme_path = await meme_gen.create_meme_fallback(template["id"], meme_data, output_filename)
            method_used = "Manual text placement"
        
        # Convert generated meme to base64 for frontend display
        meme_base64 = meme_gen.image_to_base64(meme_path)
        
        return {
            "success": True,
            "meme_data": meme_data,
            "template": {
                "id": template["id"],
                "name": template["name"],
                "box_count": template["box_count"]
            },
            "template_selection": selection_info["selection_reasoning"],
            "meme_path": meme_path,
            "meme_image": meme_base64,
            "download_url": f"/download/{output_filename}",
            "generation_method": method_used
        }
        
    except Exception as e:
        print(f"Error in generate_meme: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Meme generation failed: {str(e)}"}
        )

@app.post("/generate-meme-vision")
async def generate_meme_with_vision(
    text_input: str = Form(..., description="Text context for meme generation"),
    template_id: Optional[str] = Form(None, description="Specific template ID (optional, AI will select if not provided)"),
    user_image: Optional[UploadFile] = File(None, description="Optional user image for context")
):
    """Generate a meme specifically using Gemini Vision API for text placement with intelligent template selection"""
    try:
        # Select template intelligently
        if template_id:
            # Use specified template
            template = next((t for t in meme_gen.templates if t["id"] == template_id), None)
            if not template:
                return JSONResponse(
                    status_code=404, 
                    content={"error": "Template not found"}
                )
            selection_info = {
                "template": template,
                "selection_reasoning": {
                    "selected_template_id": template_id,
                    "template_name": template["name"],
                    "reasoning": "User-specified template",
                    "meme_concept": "User choice",
                    "confidence_score": 1.0
                }
            }
        else:
            # Use AI to select optimal template
            print(f"🧠 AI analyzing text: '{text_input[:50]}...'")
            selection_info = await meme_gen.select_optimal_template(text_input, "")
            template = selection_info["template"]
        
        # Generate meme text using AI with template context
        template_context = f"Template: {template.get('name', 'Unknown')} (Box count: {template.get('box_count', 2)})"
        layout_info = meme_gen.template_layouts.get(template["id"], {})
        if layout_info:
            template_context += f" - {layout_info.get('layout_type', 'unknown')} style"
            
        meme_data = await meme_gen.generate_meme_text(user_image, text_input, template_context)
        
        # Create the meme using Gemini Vision
        output_filename = f"vision_meme_{template['id']}_{random.randint(1000, 9999)}.jpg"
        meme_path = await meme_gen.create_meme_with_gemini_vision(template["id"], meme_data, output_filename)
        
        # Convert generated meme to base64 for frontend display
        meme_base64 = meme_gen.image_to_base64(meme_path)
        
        return {
            "success": True,
            "meme_data": meme_data,
            "template": {
                "id": template["id"],
                "name": template["name"],
                "box_count": template["box_count"]
            },
            "template_selection": selection_info["selection_reasoning"],
            "meme_path": meme_path,
            "meme_image": meme_base64,
            "download_url": f"/download/{output_filename}",
            "generation_method": "Gemini Vision API"
        }
        
    except Exception as e:
        print(f"Error in generate_meme_with_vision: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Vision-based meme generation failed: {str(e)}"}
        )

@app.post("/suggest-templates")
async def suggest_templates(request: TemplateSuggestionRequest):
    """Get AI-powered template suggestions for given text input"""
    try:
        template_options = meme_gen.get_template_options_for_ai()
        
        prompt = f"""
        You are an expert meme curator. Analyze the following text input and suggest the TOP {request.top_k} most appropriate meme templates.

        Text Input: "{request.text_input}"

        Available Templates:
        {template_options}

        Instructions:
        1. Analyze the sentiment, context, and structure of the text input
        2. Rank templates by how well they match the input
        3. Consider comedic potential and meme culture relevance
        4. Provide reasoning for each suggestion

        Return your response in this JSON format:
        {{
            "suggestions": [
                {{
                    "rank": 1,
                    "template_id": "template_id",
                    "template_name": "Template Name",
                    "reasoning": "Why this template is perfect",
                    "meme_concept": "How this would work as a meme",
                    "confidence_score": 0.95
                }}
            ],
            "analysis": "Overall analysis of the input text"
        }}

        Rank them from most suitable to least suitable.
        """

        response = meme_gen.model.generate_content(prompt)
        
        # Parse JSON response
        response_text = response.text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
        
        try:
            suggestions_data = json.loads(response_text)
            
            # Add template preview images to suggestions
            enhanced_suggestions = []
            for suggestion in suggestions_data.get("suggestions", []):
                template_id = suggestion.get("template_id")
                template = next((t for t in meme_gen.templates if t["id"] == template_id), None)
                
                if template:
                    # Add preview image if exists
                    template_filename = template["url"].split('/')[-1]
                    template_path = f"images/{template_filename}"
                    if os.path.exists(template_path):
                        suggestion["preview_image"] = meme_gen.image_to_base64(template_path)
                    
                    suggestion["template_info"] = {
                        "id": template["id"],
                        "name": template["name"],
                        "box_count": template["box_count"],
                        "url": template["url"]
                    }
                    
                enhanced_suggestions.append(suggestion)
            
            return {
                "success": True,
                "input_text": request.text_input,
                "primary_suggestion": enhanced_suggestions[0] if enhanced_suggestions else None,
                "suggestions": enhanced_suggestions,
                "reasoning": suggestions_data.get("analysis", "Template analysis completed"),
                "analysis": suggestions_data.get("analysis", "Template analysis completed"),
                "total_suggestions": len(enhanced_suggestions)
            }
            
        except json.JSONDecodeError as e:
            return JSONResponse(
                status_code=500,
                content={"error": f"Failed to parse AI suggestions: {str(e)}"}
            )
        
    except Exception as e:
        print(f"Error in suggest_templates: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Template suggestion failed: {str(e)}"}
        )

@app.get("/download/{filename}")
async def download_meme(filename: str):
    """Download generated meme"""
    file_path = f"generated/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/jpeg", filename=filename)
    else:
        raise HTTPException(status_code=404, detail="Meme not found")

@app.post("/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    context: str = Form("", description="Additional context for image analysis")
):
    """Analyze uploaded image for meme potential"""
    try:
        # Generate analysis using Gemini
        meme_data = await meme_gen.generate_meme_text(image, context, "Image analysis for meme potential")
        
        # Suggest templates with base64 images
        suggested_templates = random.sample(meme_gen.templates[:20], 3)
        
        # Add template preview images if they exist
        for template in suggested_templates:
            template_filename = template["url"].split('/')[-1]
            template_path = f"images/{template_filename}"
            if os.path.exists(template_path):
                template["preview_image"] = meme_gen.image_to_base64(template_path)
        
        return {
            "analysis": meme_data,
            "suggested_templates": suggested_templates
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Image analysis failed: {str(e)}"}
        )

@app.post("/generate-multiple-memes")
async def generate_multiple_memes(
    text_input: str = Form(..., description="Text context for meme generation"),
    template_count: int = Form(3, description="Number of different templates to generate (max 10)"),
    use_gemini_vision: bool = Form(True, description="Use Gemini Vision for text placement")
):
    """Generate multiple memes with different templates for the same text"""
    try:
        # Limit template count
        template_count = min(template_count, 10)
        
        # Select multiple popular templates
        popular_templates = [t for t in meme_gen.templates if t.get("captions", 0) > 50000]
        selected_templates = random.sample(popular_templates, min(template_count, len(popular_templates)))
        
        generated_memes = []
        
        for template in selected_templates:
            # Generate meme text for this template
            meme_context = f"Template: {template.get('name', 'Unknown')} (Box count: {template.get('box_count', 2)})"
            meme_data = await meme_gen.generate_meme_text(None, text_input, meme_context)
            
            # Create the meme
            output_filename = f"multi_meme_{template['id']}_{random.randint(1000, 9999)}.jpg"
            
            if use_gemini_vision:
                meme_path = await meme_gen.create_meme_with_gemini_vision(template["id"], meme_data, output_filename)
                method_used = "Gemini Vision API"
            else:
                meme_path = await meme_gen.create_meme_fallback(template["id"], meme_data, output_filename)
                method_used = "Manual text placement"
            
            # Convert to base64
            meme_base64 = meme_gen.image_to_base64(meme_path)
            
            generated_memes.append({
                "template": {
                    "id": template["id"],
                    "name": template["name"],
                    "box_count": template["box_count"]
                },
                "meme_data": meme_data,
                "meme_image": meme_base64,
                "meme_path": meme_path,
                "download_url": f"/download/{output_filename}",
                "generation_method": method_used
            })
        
        return {
            "success": True,
            "input_text": text_input,
            "generated_memes": generated_memes,
            "total_count": len(generated_memes)
        }
        
    except Exception as e:
        print(f"Error in generate_multiple_memes: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Multiple meme generation failed: {str(e)}"}
        )

if __name__ == "__main__":
    # Create directories
    os.makedirs("images", exist_ok=True)
    os.makedirs("generated", exist_ok=True)
    
    print("Starting AI Meme Generator...")
    print("Make sure to set your GEMINI_API_KEY in .env file")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)