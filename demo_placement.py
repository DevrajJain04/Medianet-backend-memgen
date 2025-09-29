#!/usr/bin/env python3
"""
Demo script to test improved meme text placement
Shows before/after comparison of text placement methods
"""

import os
import sys
import asyncio
from PIL import Image, ImageDraw, ImageFont
import json

# Add the current directory to path so we can import our modules
sys.path.append('.')

def demo_text_placement():
    """Demonstrate different text placement approaches"""
    
    print("🎭 Meme Text Placement Demo")
    print("=" * 50)
    
    # Check if we have meme templates
    if not os.path.exists("images"):
        print("❌ No images folder found. Please run main.py first to download templates.")
        return
    
    # Get a sample template
    template_files = [f for f in os.listdir("images") if f.endswith(('.jpg', '.png'))]
    if not template_files:
        print("❌ No template images found.")
        return
    
    sample_template = f"images/{template_files[0]}"
    print(f"📸 Using sample template: {template_files[0]}")
    
    # Demo data
    demo_texts = {
        "top_text": "WHEN YOU FINALLY",
        "bottom_text": "UNDERSTAND ASYNC/AWAIT",
        "single_text": "MIND = BLOWN"
    }
    
    # Method 1: Basic placement (current approach)
    print("\n1️⃣ Basic Text Placement (Original Method)")
    basic_result = create_basic_meme(sample_template, demo_texts)
    print(f"   ✅ Created: {basic_result}")
    
    # Method 2: Template-aware placement
    print("\n2️⃣ Template-Aware Placement (Improved Method)")
    smart_result = create_smart_meme(sample_template, demo_texts)
    print(f"   ✅ Created: {smart_result}")
    
    # Method 3: Show layout analysis
    print("\n3️⃣ Layout Analysis")
    if os.path.exists("template_layouts.json"):
        with open("template_layouts.json", "r") as f:
            layouts = json.load(f)
        print(f"   📋 Predefined layouts available: {len(layouts)}")
        for template_id, layout in list(layouts.items())[:3]:
            print(f"   - {layout['name']}: {layout['layout_type']} ({layout['optimal_text_count']} text zones)")
    
    print(f"\n🎉 Demo complete! Check the generated/ folder for results.")
    print("💡 The improved method considers:")
    print("   - Template-specific text zones")
    print("   - Optimal text positioning")
    print("   - Better font sizing")
    print("   - Smart text wrapping")

def create_basic_meme(template_path, texts):
    """Create meme with basic text placement"""
    try:
        image = Image.open(template_path)
        draw = ImageDraw.Draw(image)
        width, height = image.size
        
        # Basic font
        try:
            font_size = max(width // 20, 24)
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            font = None
        
        # Basic top text
        if texts.get("top_text"):
            text = texts["top_text"]
            if font:
                bbox = draw.textbbox((0, 0), text, font=font)
                text_width = bbox[2] - bbox[0]
            else:
                text_width = len(text) * 10
            x = (width - text_width) // 2
            y = height // 20
            draw_text_with_outline(draw, (x, y), text, font)
        
        # Basic bottom text
        if texts.get("bottom_text"):
            text = texts["bottom_text"]
            if font:
                bbox = draw.textbbox((0, 0), text, font=font)
                text_width = bbox[2] - bbox[0]
                text_height = bbox[3] - bbox[1]
            else:
                text_width = len(text) * 10
                text_height = 20
            x = (width - text_width) // 2
            y = height - text_height - height // 20
            draw_text_with_outline(draw, (x, y), text, font)
        
        os.makedirs("generated", exist_ok=True)
        output_path = "generated/demo_basic_placement.jpg"
        image.save(output_path, "JPEG", quality=95)
        return output_path
        
    except Exception as e:
        print(f"Error creating basic meme: {e}")
        return None

def create_smart_meme(template_path, texts):
    """Create meme with smart text placement"""
    try:
        image = Image.open(template_path)
        draw = ImageDraw.Draw(image)
        width, height = image.size
        
        # Adaptive font sizing
        base_font_size = max(width // 25, 16)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", base_font_size)
        except:
            font = None
        
        # Use percentage-based positioning
        zones = [
            {
                "zone_name": "top_area",
                "x_percent": 0.1, "y_percent": 0.05,
                "width_percent": 0.8, "height_percent": 0.2,
                "alignment": "center", "text_size": "medium"
            },
            {
                "zone_name": "bottom_area",
                "x_percent": 0.1, "y_percent": 0.75,
                "width_percent": 0.8, "height_percent": 0.2,
                "alignment": "center", "text_size": "medium"
            }
        ]
        
        # Place top text
        if texts.get("top_text"):
            zone = zones[0]
            draw_text_in_zone_demo(draw, texts["top_text"], zone, (width, height), font)
        
        # Place bottom text  
        if texts.get("bottom_text"):
            zone = zones[1]
            draw_text_in_zone_demo(draw, texts["bottom_text"], zone, (width, height), font)
        
        os.makedirs("generated", exist_ok=True)
        output_path = "generated/demo_smart_placement.jpg"
        image.save(output_path, "JPEG", quality=95)
        return output_path
        
    except Exception as e:
        print(f"Error creating smart meme: {e}")
        return None

def draw_text_in_zone_demo(draw, text, zone, image_size, font):
    """Demo version of smart text placement"""
    if not text:
        return
        
    width, height = image_size
    
    # Calculate zone dimensions
    zone_x = int(zone["x_percent"] * width)
    zone_y = int(zone["y_percent"] * height)
    zone_width = int(zone["width_percent"] * width)
    zone_height = int(zone["height_percent"] * height)
    
    # Simple text wrapping
    words = text.split()
    lines = []
    current_line = []
    max_chars = zone_width // 12  # Rough estimate
    
    for word in words:
        test_line = ' '.join(current_line + [word])
        if len(test_line) <= max_chars or not current_line:
            current_line.append(word)
        else:
            lines.append(' '.join(current_line))
            current_line = [word]
    
    if current_line:
        lines.append(' '.join(current_line))
    
    # Draw lines
    line_height = (font.size + 5) if font else 25
    total_height = len(lines) * line_height
    start_y = zone_y + (zone_height - total_height) // 2
    
    for i, line in enumerate(lines):
        if font:
            bbox = draw.textbbox((0, 0), line, font=font)
            line_width = bbox[2] - bbox[0]
        else:
            line_width = len(line) * 10
            
        x = zone_x + (zone_width - line_width) // 2  # Center align
        y = start_y + (i * line_height)
        
        draw_text_with_outline(draw, (x, y), line.upper(), font)

def draw_text_with_outline(draw, position, text, font, fill_color="white", outline_color="black", outline_width=2):
    """Draw text with outline"""
    x, y = position
    # Draw outline
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx != 0 or dy != 0:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_color)
    # Draw main text
    draw.text(position, text, font=font, fill=fill_color)

if __name__ == "__main__":
    demo_text_placement()
