# AI-Powered Meme Generator with Intelligent Template Selection

## 🎯 Overview

This enhanced meme generator now features intelligent template selection powered by Google Gemini AI. Instead of randomly selecting meme templates, the system analyzes the input text and context to choose the most appropriate template for maximum comedic impact.

## 🚀 Key Features

### 1. Intelligent Template Selection

- **AI-Driven Choice**: Uses Gemini AI to analyze text input and select optimal templates
- **Context Awareness**: Considers text content, tone, and intended humor style
- **40+ Templates**: Comprehensive library with detailed use case mappings
- **Fallback System**: Graceful degradation to popular templates if AI selection fails

### 2. Enhanced Text Positioning

- **Template-Specific Layouts**: Custom positioning for each meme template
- **Responsive Font Sizing**: Automatic font size adjustment (16-80px range)
- **Improved Bounds Checking**: Ensures text stays within image boundaries
- **Better Text Wrapping**: Smart line breaks and generous padding

### 3. Frontend-Ready API

- **Base64 Image Return**: Images returned as base64 strings for direct frontend display
- **CORS Enabled**: Ready for web frontend integration
- **Detailed Responses**: Includes template selection reasoning and metadata
- **Multiple Endpoints**: Generation, suggestions, and computer vision analysis

## 🛠 API Endpoints

### POST `/generate-meme`

Generates a meme with intelligent template selection.

**Request:**

```json
{
  "image_description": "A programmer working late",
  "text_input": "When you finally fix that bug at 3 AM"
}
```

**Response:**

```json
{
  "message": "Meme generated successfully",
  "generated_texts": ["When you finally fix", "that bug at 3 AM"],
  "template_used": "Success Kid",
  "template_id": "61544",
  "template_selection_reasoning": "Selected Success Kid template because...",
  "image_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### POST `/suggest-templates`

Gets template suggestions for given text input.

**Request:**

```json
{
  "text_input": "When someone says they prefer tabs over spaces"
}
```

**Response:**

```json
{
    "primary_suggestion": {
        "id": "87743020",
        "name": "Two Buttons"
    },
    "alternatives": [...],
    "reasoning": "The text suggests a choice/dilemma scenario..."
}
```

### POST `/generate-meme-with-vision`

Enhanced generation with computer vision analysis of uploaded images.

## 🎨 Template Selection Logic

The AI considers several factors when selecting templates:

1. **Content Analysis**: What the text is about (technical, emotional, comparison, etc.)
2. **Humor Style**: Sarcasm, celebration, confusion, explanation, etc.
3. **Structure**: Single statement vs. comparison vs. progression
4. **Popular Associations**: Common meme patterns and cultural references

### Template Categories

- **Comparison/Choice**: Drake, Two Buttons, Expanding Brain
- **Reaction/Emotion**: Surprised Pikachu, Distracted Boyfriend, This Is Fine
- **Explanation/Teaching**: Lisa Simpson Presentation, Change My Mind
- **Achievement/Success**: Success Kid, Victory Dance
- **Confusion/Suspicion**: Futurama Fry, Conspiracy Keanu
- **General Reaction**: SpongeBob, Kermit, Grumpy Cat

## 📊 Template Database

The system includes 40+ popular meme templates with:

- Precise text zone coordinates
- Optimal text count recommendations
- Use case descriptions for AI selection
- Layout type classifications
- Popular culture context

## 🔧 Technical Architecture

```
User Input → AI Analysis → Template Selection → Text Generation → Image Composition → Base64 Return
     ↓              ↓              ↓              ↓              ↓              ↓
- Text content  - Context      - Best match   - Contextual   - Precise      - Frontend
- Description   - Reasoning    - Fallbacks    - Humor        - Positioning  - Ready
```

## 🧪 Testing

Use the included test script to verify functionality:

```bash
python test_template_selection.py
```

This will test:

- Template suggestion accuracy
- Intelligent meme generation
- Base64 image encoding
- Error handling

## 🎯 Usage Examples

### Programming Humor

**Input:** "When you fix a bug but create three more"
**Selected:** Disaster Girl (chaos/unintended consequences)

### Achievement

**Input:** "Finally understood how async/await works"
**Selected:** Success Kid (celebration/victory)

### Comparison

**Input:** "Frontend vs Backend developers"
**Selected:** Drake or Epic Handshake (comparison/contrast)

### Confusion

**Input:** "This code works but I have no idea why"
**Selected:** Futurama Fry (suspicion/uncertainty)

## 🔮 Future Enhancements

1. **Learning System**: Template selection improves based on user feedback
2. **Custom Templates**: Upload and configure new meme templates
3. **Multi-Language**: Support for non-English meme generation
4. **Advanced Vision**: Better integration with image analysis
5. **Template Trends**: Dynamic popularity-based selection weighting

## 🚀 Getting Started

1. Ensure you have a Gemini API key in your `.env` file
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `python main.py`
4. Test the API: `python test_template_selection.py`
5. Use the endpoints in your frontend application

The system is now ready for production use with intelligent, context-aware meme generation!
